import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@latest';

document.addEventListener("DOMContentLoaded", function() {
  const chatContainer = document.getElementById("chat-container");
  const chatDiv = document.getElementById("chat");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  const modeToggleBtn = document.getElementById("modeToggleBtn");

  let isEducationalMode = true;
  let activeLoadingProcesses = 0;
  
  const models = {};
  const modelConfigs = {
    translator: { task: 'translation', modelId: 'Xenova/opus-mt-en-fr' },
    captioner: { task: 'image-to-text', modelId: 'Xenova/blip-image-captioning-base' },
    generator: { task: 'text2text-generation', modelId: 'Xenova/flan-t5-small' }
  };

  async function loadModel(modelName) {
    if (models[modelName]) return models[modelName];
    const config = modelConfigs[modelName];
    if (!config) return null;
    showLoading();
    try {
      const model = await pipeline(config.task, config.modelId);
      models[modelName] = model;
      console.log(`✅ ${modelName} model loaded.`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load ${modelName}:`, error);
      addMessage(`Error: The ${modelName} model failed to load.`, "note");
      return null;
    } finally {
      hideLoading();
    }
  }
  
  function showLoading() { 
    activeLoadingProcesses++;
    if (activeLoadingProcesses === 1) {
      const loaderDiv = document.createElement('div'); 
      loaderDiv.classList.add('message', 'note', 'loading-indicator-wrapper'); 
      loaderDiv.innerHTML = `<div class="loading-indicator"><svg class="infinity-loader" viewBox="0 0 100 40"><path d="M20,20 Q30,5 40,20 T60,20 T80,20" /></svg></div>`; 
      chatDiv.appendChild(loaderDiv); 
      chatContainer.scrollTop = chatContainer.scrollHeight; 
    }
  }
  function hideLoading() { 
    activeLoadingProcesses--;
    if (activeLoadingProcesses <= 0) {
      activeLoadingProcesses = 0;
      const existingLoader = chatDiv.querySelector('.loading-indicator-wrapper'); 
      if (existingLoader) { existingLoader.remove(); }
    }
  }
  
  function addMessage(text, sender, extraClass = '') {
    const messageDiv = document.createElement('div'); 
    messageDiv.classList.add('message', sender);
    if(extraClass) messageDiv.classList.add(extraClass);
    const bubbleDiv = document.createElement('div'); 
    bubbleDiv.classList.add('message-bubble'); 
    bubbleDiv.innerHTML = text.replace(/\n/g, "<br>");
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestampSpan = document.createElement('span'); 
    timestampSpan.classList.add('timestamp'); 
    timestampSpan.textContent = timestamp;
    messageDiv.appendChild(bubbleDiv); 
    messageDiv.appendChild(timestampSpan); 
    chatDiv.appendChild(messageDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    return messageDiv;
  }

  // --- SIMPLIFIED & RELIABLE LOGIC ---
  async function handleGeneralQuery(query) {
    // 1. Try Wikipedia first for a reliable answer
    let wikiResult = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data ? data.extract : null)
      .catch(() => null);
    
    if (wikiResult) {
      return wikiResult;
    }

    // 2. If Wikipedia fails, use the AI model as a fallback
    const generator = await loadModel('generator');
    if (!generator) return "I'm having trouble connecting to my knowledge base.";
    
    const prompt = `Provide a concise answer to: ${query}`;
    const t5Out = await generator(prompt, { max_new_tokens: 80 });
    return t5Out[0].generated_text.trim();
  }

  // --- EVENT LISTENERS ---
  sendBtn.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (!message) return;
    addMessage(message, "user");
    userInput.value = "";
    showLoading();
    
    let response = "I had trouble processing that.";
    const lowerText = message.toLowerCase();

    // Handle simple greetings with pre-defined responses
    if (lowerText === 'hi' || lowerText === 'hello') {
        response = "Hello there! How can I help you today?";
    } else if (lowerText === 'help') {
        response = `Available commands: "math: 2+2", "wiki: Einstein", "chart: A:10, B:20", "translate to french hello", upload an image.`;
    } else if (lowerText === 'status') {
        response = `Model Status:\n${Object.keys(modelConfigs).map(name => `- ${name}: ${models[name] ? 'ready' : 'idle'}`).join('\n')}`;
    } else if (lowerText.startsWith('math:')) {
        try { const result = math.evaluate(message.substring(5).trim()); response = `The result is: ${result}`; } 
        catch (error) { response = 'Invalid mathematical expression. Please check your syntax.'; }
    } else if (lowerText.startsWith('wiki:')) {
        response = await handleGeneralQuery(message.substring(5).trim());
    } else if (lowerText.startsWith('translate to french')) {
        const translator = await loadModel('translator');
        if (!translator) response = "Translation model is not available.";
        else { const textToTranslate = message.substring('translate to french'.length).trim(); const result = await translator(textToTranslate); response = `French translation: ${result[0].translation_text}`; }
    } else {
        // For all other general questions, use the simplified handler
        response = await handleGeneralQuery(message);
    }
    
    hideLoading();
    addMessage(response, "note");
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageUrl = e.target.result; addImageMessage(imageUrl, "user"); showLoading();
        const captioner = await loadModel('captioner');
        if (!captioner) { hideLoading(); addMessage("Image model not available.", "note"); return; }
        const ocr = await Tesseract.recognize(imageUrl, 'eng');
        const ocrText = ocr.data.text.trim();
        const blipOut = await captioner(imageUrl);
        const caption = blipOut[0].generated_text;
        hideLoading();
        addMessage(`I see an image. Caption: "${caption}". Extracted Text: "${ocrText}"`, "note");
        fileInput.value = '';
    };
    reader.readAsDataURL(file);
  });

  uploadBtn.addEventListener('click', () => fileInput.click());
  userInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); } });
  
  function addImageMessage(url, sender) {
    const messageDiv = document.createElement('div'); messageDiv.classList.add('message', sender);
    const img = document.createElement('img'); img.src = url; img.classList.add('message-image');
    messageDiv.appendChild(img); chatDiv.appendChild(messageDiv);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
  }

  chatContainer.addEventListener('scroll', () => {
    const isAtBottom = chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 50;
    scrollToBottomBtn.classList.toggle('hidden', isAtBottom);
  });
  scrollToBottomBtn.addEventListener('click', () => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); });

  // --- FIXED MODE TOGGLE ---
  modeToggleBtn.addEventListener('click', () => {
    isEducationalMode = !isEducationalMode;
    const icon = modeToggleBtn.querySelector('i');
    icon.classList.toggle('fa-brain', !isEducationalMode);
    icon.classList.toggle('fa-graduation-cap', isEducationalMode);
    modeToggleBtn.title = isEducationalMode ? 'Switch to Casual Mode' : 'Switch to Educational Mode';
    // Use a simple, hard-coded message
    const modeMessage = isEducationalMode ? "Educational Mode enabled. I will provide more detailed answers." : "Casual Mode enabled. I'm ready for a more relaxed conversation.";
    addMessage(modeMessage, "note", "assistant-highlight");
  });

  addMessage("Hello! I'm NOTE. How can I help you today?", "note", "assistant-highlight");
});

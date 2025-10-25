// Import the pipeline function from transformers.js
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@latest';

document.addEventListener("DOMContentLoaded", function() {
  // --- DOM ELEMENTS ---
  const chatContainer = document.getElementById("chat-container");
  const chatDiv = document.getElementById("chat");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  const modeToggleBtn = document.getElementById("modeToggleBtn");

  // --- STATE ---
  let isEducationalMode = true;
  let activeLoadingProcesses = 0;
  
  const models = {};
  const modelConfigs = {
    translator: { task: 'translation', modelId: 'Xenova/opus-mt-en-fr' },
    captioner: { task: 'image-to-text', modelId: 'Xenova/blip-image-captioning-base' },
    detector: { task: 'object-detection', modelId: 'Xenova/detr-resnet-50' },
    generator: { task: 'text2text-generation', modelId: 'Xenova/flan-t5-small' },
    refiner: { task: 'summarization', modelId: 'Xenova/distilbart-cnn-12-6' }
  };

  // --- ROBUST MODEL LOADING ---
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
  
  // --- UI HELPERS ---
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
  
  // --- CORE FEATURE FUNCTIONS ---
  function handleMath(expression) {
    try { const result = math.evaluate(expression); return `The result is: ${result}`; } 
    catch (error) { return 'Invalid mathematical expression. Please check your syntax.'; }
  }
  function handleChart(dataString) { /* ... (chart function is unchanged) ... */ }
  async function handleWikipedia(query) { /* ... (wiki function is unchanged) ... */ }

  // --- REWRITTEN CENTRAL BRAIN ---
  async function mainController(userMessage, imageUrl = null) {
    let data = userMessage;

    // 1. Handle image input
    if (imageUrl) {
      const captioner = await loadModel('captioner');
      if (!captioner) return "Image model not available.";
      const ocr = await Tesseract.recognize(imageUrl, 'eng');
      const ocrText = ocr.data.text.trim();
      const blipOut = await captioner(imageUrl);
      data = `Image Caption: "${blipOut[0].generated_text}". Extracted Text: "${ocrText}".`;
    }

    // 2. Try math solving
    try { if (/[0-9\+\-\*\/\^=]/.test(data)) { const result = math.evaluate(data); if (result !== undefined) return `📐 Math result: ${result}`; } } 
    catch (e) { /* Not a pure math expression, continue */ }

    // 3. Handle simple greetings in casual mode for a quick, human-like response
    const lowerMessage = userMessage.toLowerCase();
    if (!isEducationalMode && (lowerMessage.startsWith('hi') || lowerMessage.startsWith('hello') || lowerMessage === 'how are you')) {
        const greetings = { 'hi': 'Hey there!', 'hello': 'Hello to you too!', 'how are you': "I'm doing great, thanks for asking! What's up?" };
        for (const key in greetings) { if (lowerMessage.includes(key)) return greetings[key]; }
    }

    // 4. Create a simple, clear prompt for the AI model
    const persona = isEducationalMode ? 'helpful expert' : 'friendly assistant';
    const prompt = `As a ${persona}, provide a clear and concise answer to the following question: ${data}`;

    // 5. Generate answer using Flan-T5
    const generator = await loadModel('generator');
    if (!generator) return "Main reasoning model not available.";
    const t5Out = await generator(prompt, { max_new_tokens: 100 });
    let initialAnswer = t5Out[0].generated_text.trim();

    // 6. Use the refiner to clean up the answer and make it sound better
    const refiner = await loadModel('refiner');
    if (refiner && initialAnswer) {
      try {
        const refinedOut = await refiner(initialAnswer, { max_new_tokens: 120 });
        initialAnswer = refinedOut[0].summary_text;
      } catch (e) { console.error("Refiner failed, using T5 output.", e); }
    }
    
    // 7. Add factual info (Wikipedia hybrid), more aggressively in Educational mode
    if (isEducationalMode) {
      try {
        const query = encodeURIComponent(data.split(" ").slice(0,3).join(" "));
        const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
        if (wiki.ok) {
          const info = await wiki.json();
          if (info.extract && info.extract.length > 50) {
            initialAnswer += `\n\n📘 For further reading, here is a summary from Wikipedia: ${info.extract}`;
          }
        }
      } catch (e) { console.error("Wikipedia fetch failed.", e); }
    }

    return initialAnswer;
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

    if (lowerText === 'help') { response = `Available commands: "math: 2+2", "wiki: Einstein", "chart: A:10, B:20", "translate to french hello", upload an image, "status", "free memory", "retry <model_name>".`; }
    else if (lowerText === 'status') { response = `Model Status:\n${Object.keys(modelConfigs).map(name => `- ${name}: ${models[name] ? 'ready' : 'idle'}`).join('\n')}`; }
    else if (lowerText === 'free memory') { for (const modelName in models) delete models[modelName]; response = "All models have been unloaded from memory."; }
    else if (lowerText.startsWith('retry ')) { const modelName = lowerText.split(' ')[1]; if (modelConfigs.hasOwnProperty(modelName)) { delete models[modelName]; await loadModel(modelName); response = `Retrying ${modelName} model...`; } else { response = `Unknown model: ${modelName}.`; } }
    else if (lowerText.startsWith('math:')) { response = handleMath(message.substring(5).trim()); }
    else if (lowerText.startsWith('wiki:')) { response = await handleWikipedia(message.substring(5).trim()); }
    else if (lowerText.startsWith('chart:')) { response = handleChart(message.substring(6).trim()); }
    else if (lowerText.startsWith('translate to french')) { const translator = await loadModel('translator'); if (!translator) response = "Translation model is not available."; else { const textToTranslate = message.substring('translate to french'.length).trim(); const result = await translator(textToTranslate); response = `French translation: ${result[0].translation_text}`; } }
    else { response = await mainController(message); }
    
    hideLoading();
    addMessage(response, "note");
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageUrl = e.target.result; addImageMessage(imageUrl, "user"); showLoading();
        const response = await mainController("[User uploaded an image]", imageUrl);
        hideLoading(); addMessage(response, "note"); fileInput.value = '';
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

  modeToggleBtn.addEventListener('click', () => {
    isEducationalMode = !isEducationalMode;
    const icon = modeToggleBtn.querySelector('i');
    icon.classList.toggle('fa-brain', !isEducationalMode);
    icon.classList.toggle('fa-graduation-cap', isEducationalMode);
    modeToggleBtn.title = isEducationalMode ? 'Switch to Casual Mode' : 'Switch to Educational Mode';
    const modeMessage = isEducationalMode ? "Educational Mode enabled. I will now provide detailed, research-oriented answers." : "Casual Mode enabled. I'm ready for a more relaxed conversation.";
    addMessage(modeMessage, "note", "assistant-highlight");
  });

  addMessage(isEducationalMode ? "Educational Mode enabled. How can I assist you with your research today?" : "Casual Mode enabled. What's on your mind?", "note", "assistant-highlight");
});
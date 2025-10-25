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
    generator: { task: 'text2text-generation', modelId: 'Xenova/flan-t5-small' }
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

  // --- NEW: Function to fetch and display an image ---
  async function fetchAndDisplayImage(subject) {
    try {
      const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(subject)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.originalimage && data.originalimage.source) {
          const messageDiv = addMessage("", "note");
          const bubble = messageDiv.querySelector('.message-bubble');
          bubble.textContent = `Here is an image of ${subject}:`;
          const img = document.createElement('img');
          img.src = data.originalimage.source;
          img.classList.add('message-image');
          bubble.appendChild(img);
          return true;
        }
      }
    } catch (error) { console.error("Could not fetch image:", error); }
    return false;
  }

  // --- REWRITTEN CENTRAL BRAIN ---
  async function mainController(userMessage, imageUrl = null) {
    let data = userMessage;
    let responseText = '';

    // 1. Handle image input with advanced logic
    if (imageUrl) {
      const captioner = await loadModel('captioner');
      if (!captioner) return "Image model not available.";
      
      const ocr = await Tesseract.recognize(imageUrl, 'eng');
      const ocrText = ocr.data.text.trim();
      const blipOut = await captioner(imageUrl);
      const caption = blipOut[0].generated_text;
      
      // Check for direct questions about the image
      const lowerMessage = userMessage.toLowerCase();
      if (lowerMessage.includes("who is") && caption.toLowerCase().includes("portrait of")) {
        const personName = caption.replace("portrait of", "").trim();
        data = `Who is ${personName}?`;
      } else if (lowerMessage.includes("solve") || lowerMessage.includes("what is") && /[0-9+\-*/()]/.test(ocrText)) {
        // Try to solve math from OCR
        try {
          const result = math.evaluate(ocrText);
          responseText = `I solved the math problem in the image. The answer is: ${result}`;
          return responseText;
        } catch (e) {
          // If it's a word problem, ask the AI to solve it
          data = `Solve this word problem: ${ocrText}`;
        }
      } else {
        // General image analysis
        data = `This is an image. The caption is: "${caption}". The extracted text is: "${ocrText}". Based on this, ${userMessage}`;
      }
    }

    // 2. Create a direct and simple prompt
    const persona = isEducationalMode ? 'an expert researcher' : 'a helpful assistant';
    const prompt = `As ${persona}, provide a direct and concise answer to the following question: ${data}`;

    // 3. Generate answer using only the main generator for speed
    const generator = await loadModel('generator');
    if (!generator) return "Main reasoning model not available.";
    
    const t5Out = await generator(prompt, { max_new_tokens: 100 });
    responseText = t5Out[0].generated_text.trim();

    // 4. If the user asks for more details or it's educational mode, fetch an image
    if (isEducationalMode || userMessage.toLowerCase().includes("more details") || userMessage.toLowerCase().includes("tell me more")) {
      // Simple keyword extraction to find a subject
      const words = responseText.split(" ");
      for (const word of words) {
        if (word.length > 5) { // Heuristic for a potential subject
          if (await fetchAndDisplayImage(word)) {
            break; // Stop after finding one image
          }
        }
      }
    }
    
    return responseText;
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
        const response = await mainController("Analyze this image.", imageUrl);
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
    const modeMessage = isEducationalMode ? "Educational Mode enabled. I will provide more detailed answers and visual aids." : "Casual Mode enabled. I'm ready for a more relaxed conversation.";
    addMessage(modeMessage, "note", "assistant-highlight");
  });

  addMessage("Hello! I'm NOTE. I can now solve math problems from images, identify people, and provide visual aids. How can I help you today?", "note", "assistant-highlight");
});

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
  
  // --- CORE FEATURE FUNCTIONS (FIXED AND COMPLETE) ---
  function handleMath(expression) {
    try { const result = math.evaluate(expression); return `The result is: ${result}`; } 
    catch (error) { return 'Invalid mathematical expression. Please check your syntax.'; }
  }

  function handleChart(dataString) {
    const dataPairs = dataString.split(',');
    const labels = []; const data = [];
    for (const pair of dataPairs) { const [label, value] = pair.split(':').map(s => s.trim()); if (label && !isNaN(value)) { labels.push(label); data.push(parseFloat(value)); } }
    if (labels.length === 0) return "Invalid chart data. Use format: 'label:value, label:value'.";
    const messageElement = addMessage("", "note"); const bubble = messageElement.querySelector('.message-bubble');
    bubble.textContent = "Here is your chart:"; const canvas = document.createElement('canvas'); bubble.appendChild(canvas);
    new Chart(canvas, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Data', data: data, backgroundColor: 'rgba(224, 230, 241, 0.5)', borderColor: 'rgba(224, 230, 241, 1)', borderWidth: 1 }] }, options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Custom Chart', color: '#b8c5d6' } }, scales: { y: { beginAtZero: true, ticks: { color: '#a0b0c5' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#a0b0c5' }, grid: { color: 'rgba(255,255,255,0.1)' } } } });
    return null;
  }

  async function handleWikipedia(query) {
    try { const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`; const summaryResponse = await fetch(summaryUrl); if (summaryResponse.ok) { const data = await summaryResponse.json(); return data.extract || "I found a page, but it doesn't have a summary."; } else { return `Sorry, I couldn't find a Wikipedia article for "${query}".`; } }
    catch (error) { console.error("Wikipedia error:", error); return `Sorry, I had trouble accessing Wikipedia. Please try again later.`; }
  }

  // --- SIMPLIFIED AND ROBUST CENTRAL BRAIN ---
  async function mainController(userMessage, imageUrl = null) {
    let promptText = userMessage;
    if (imageUrl) {
      const captioner = await loadModel('captioner');
      if (!captioner) return "Image model not available.";
      const ocr = await Tesseract.recognize(imageUrl, 'eng');
      const ocrText = ocr.data.text.trim();
      const blipOut = await captioner(imageUrl);
      const caption = blipOut[0].generated_text;
      promptText = `Image Caption: "${caption}". Extracted Text: "${ocrText}". Based on the image, ${userMessage}`;
    }
    const lowerMessage = userMessage.toLowerCase().trim();
    if (!isEducationalMode && (lowerMessage === 'hi' || lowerMessage === 'hello')) { return lowerMessage === 'hi' ? 'Hey there!' : 'Hello to you too!'; }
    if (lowerMessage === 'how are you') { return "I'm doing great, thanks for asking! How can I help you?"; }
    try { if (/[0-9+\-*/()]/.test(promptText)) { const result = math.evaluate(promptText); if (result !== undefined) return `📐 The answer is: ${result}`; } } catch (e) { /* Not a math expression, continue */ }
    const persona = isEducationalMode ? 'a helpful expert' : 'a friendly assistant';
    const prompt = `As ${persona}, answer this question directly: ${promptText}`;
    const generator = await loadModel('generator');
    if (!generator) return "Main reasoning model not available.";
    const t5Out = await generator(prompt, { max_new_tokens: 100 });
    let answer = t5Out[0].generated_text.trim();
    if (isEducationalMode) {
      const words = answer.split(" ");
      for (const word of words) {
        if (word.length > 5) {
          try {
            const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(word)}`);
            if (response.ok) {
              const data = await response.json();
              if (data.originalimage && data.originalimage.source) {
                const messageDiv = addMessage("", "note");
                const bubble = messageDiv.querySelector('.message-bubble');
                bubble.textContent = `Here is an image related to ${word}:`;
                const img = document.createElement('img');
                img.src = data.originalimage.source;
                img.classList.add('message-image');
                bubble.appendChild(img);
                break;
              }
            }
          } catch (error) { console.error("Could not fetch image:", error); }
        }
      }
    }
    return answer;
  }
  
  // --- EVENT LISTENERS (WRAPPED IN TRY/CATCH) ---
  sendBtn.addEventListener("click", async () => {
    try {
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
    } catch (error) {
      console.error("An error occurred in the send button listener:", error);
      hideLoading();
      addMessage("An unexpected error occurred. Please try again.", "note");
    }
  });

  fileInput.addEventListener('change', async (event) => {
    try {
      const file = event.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
          const imageUrl = e.target.result; addImageMessage(imageUrl, "user"); showLoading();
          const response = await mainController("Analyze this image.", imageUrl);
          hideLoading(); addMessage(response, "note"); fileInput.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("An error occurred during file upload:", error);
      hideLoading();
      addMessage("Failed to process the image.", "note");
    }
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

  addMessage("Hello! I'm NOTE. I can solve math problems, describe images, and answer your questions. How can I help you today?", "note", "assistant-highlight");
});

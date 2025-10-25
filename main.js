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
  let isEducationalMode = false;
  let activeLoadingProcesses = 0;
  
  // Conversation history to provide context to the AI
  let conversationHistory = [
    { role: 'system', content: 'You are NOTE, a highly intelligent and helpful AI assistant created by hafij shaikh. Your personality is calm, knowledgeable, and slightly formal. You answer questions clearly and concisely, and you can perform complex tasks like solving math, describing images, and summarizing information.' }
  ];
  
  const models = {};
  const modelConfigs = {
    translator: { task: 'translation', modelId: 'Xenova/opus-mt-en-fr' },
    captioner: { task: 'image-to-text', modelId: 'Xenova/blip-image-captioning-base' },
    detector: { task: 'object-detection', modelId: 'Xenova/detr-resnet-50' },
    generator: { task: 'text2text-generation', modelId: 'Xenova/flan-t5-small' },
    refiner: { task: 'summarization', modelId: 'Xenova/distilbart-cnn-12-6' }
  };

  // --- ROBUST MODEL LOADING WITH TRY/CATCH ---
  async function loadModel(modelName) {
    if (models[modelName]) return models[modelName]; // Return if already loaded

    const config = modelConfigs[modelName];
    if (!config) {
        console.error(`Configuration for model "${modelName}" not found.`);
        return null;
    }
    
    showLoading();
    try {
      const model = await pipeline(config.task, config.modelId);
      models[modelName] = model;
      console.log(`✅ ${modelName} model loaded successfully.`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load ${modelName} model:`, error);
      addMessage(`Error: The ${modelName} model failed to load. Please check your connection and try again.`, "note");
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
    try {
      const result = math.evaluate(expression);
      return `The result is: ${result}`;
    } catch (error) {
      return 'Invalid mathematical expression. Please check your syntax.';
    }
  }

  function handleChart(dataString) {
    const dataPairs = dataString.split(',');
    const labels = [];
    const data = [];
    for (const pair of dataPairs) {
      const [label, value] = pair.split(':').map(s => s.trim());
      if (label && !isNaN(value)) {
        labels.push(label);
        data.push(parseFloat(value));
      }
    }
    if (labels.length === 0) return "Invalid chart data. Use format: 'label:value, label:value'";

    const messageElement = addMessage("", "note");
    const bubble = messageElement.querySelector('.message-bubble');
    bubble.textContent = "Here is your chart:";
    
    const canvas = document.createElement('canvas');
    bubble.appendChild(canvas);
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: 'Data', data: data, backgroundColor: 'rgba(224, 230, 241, 0.5)', borderColor: 'rgba(224, 230, 241, 1)', borderWidth: 1 }]
      },
      options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Custom Chart', color: '#b8c5d6' } }, scales: { y: { beginAtZero: true, ticks: { color: '#a0b0c5' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#a0b0c5' }, grid: { color: 'rgba(255,255,255,0.1)' } } } }
    });
    return null;
  }

  async function handleWikipedia(query) {
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const summaryResponse = await fetch(summaryUrl);
      if (summaryResponse.ok) {
        const data = await summaryResponse.json();
        return data.extract || "I found a page, but it doesn't have a summary.";
      } else {
        return `Sorry, I couldn't find a Wikipedia article for "${query}".`;
      }
    } catch (error) {
      console.error("Wikipedia error:", error);
      return `Sorry, I had trouble accessing Wikipedia. Please try again later.`;
    }
  }

  // --- IMPROVED CENTRAL BRAIN WITH CONVERSATION HISTORY ---
  async function mainController(userMessage, imageUrl = null) {
    let data = userMessage;

    // 1. Handle image input
    if (imageUrl) {
      const captioner = await loadModel('captioner');
      if (!captioner) return "Image model not available.";
      
      const ocr = await Tesseract.recognize(imageUrl, 'eng');
      const ocrText = ocr.data.text.trim();
      const blipOut = await captioner(imageUrl);
      data = `The user uploaded an image. The image caption is: "${blipOut[0].generated_text}". Extracted text from the image is: "${ocrText}". Please analyze this and respond to the user.`;
    }

    // 2. Try math solving
    try {
      if (/[0-9\+\-\*\/\^=]/.test(data)) {
        const result = math.evaluate(data);
        if (result !== undefined) return `📐 Math result: ${result}`;
      }
    } catch (e) { /* Not a pure math expression, continue */ }

    // 3. Add user's message to history
    conversationHistory.push({ role: 'user', content: userMessage });

    // 4. Construct the prompt with conversation history
    const prompt = conversationHistory.map(turn => `${turn.role}: ${turn.content}`).join('\n') + '\nAI:';

    // 5. Generate answer using Flan-T5
    const generator = await loadModel('generator');
    if (!generator) return "Main reasoning model not available.";
    const t5Out = await generator(prompt, { max_new_tokens: 150 });
    let answer = t5Out[0].generated_text.trim();

    // 6. Add factual info (Wikipedia hybrid)
    try {
      const query = encodeURIComponent(data.split(" ").slice(0,5).join(" "));
      const wiki = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${query}`);
      if (wiki.ok) {
        const info = await wiki.json();
        if (info.extract) answer += `\n\n📘 For more context, here is some information from Wikipedia: ${info.extract}`;
      }
    } catch (e) {
      console.error("Wikipedia fetch failed.", e);
    }

    // 7. Add AI's response to history
    conversationHistory.push({ role: 'AI', content: answer });

    // 8. Keep history from getting too long
    if (conversationHistory.length > 10) {
      // Keep the system prompt and the last 9 turns
      conversationHistory = [conversationHistory[0], ...conversationHistory.slice(-9)];
    }

    localStorage.setItem('last_conversation', `${userMessage} → ${answer}`);
    return answer;
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

    if (lowerText === 'help') {
        response = `Available commands: "math: 2+2", "wiki: Einstein", "chart: A:10, B:20", "translate to french hello", upload an image, "status", "free memory", "retry <model_name>".`;
    } else if (lowerText === 'status') {
        response = `Model Status:\n${Object.keys(modelConfigs).map(name => `- ${name}: ${models[name] ? 'ready' : 'idle'}`).join('\n')}`;
    } else if (lowerText === 'free memory') {
        for (const modelName in models) delete models[modelName];
        response = "All models have been unloaded from memory.";
    } else if (lowerText.startsWith('retry ')) {
        const modelName = lowerText.split(' ')[1];
        if (modelConfigs.hasOwnProperty(modelName)) {
            delete models[modelName]; // Unload to force reload
            await loadModel(modelName);
            response = `Retrying ${modelName} model...`;
        } else {
            response = `Unknown model: ${modelName}.`;
        }
    } else if (lowerText.startsWith('math:')) {
        response = handleMath(message.substring(5).trim());
    } else if (lowerText.startsWith('wiki:')) {
        response = await handleWikipedia(message.substring(5).trim());
    } else if (lowerText.startsWith('chart:')) {
        response = handleChart(message.substring(6).trim());
    } else if (lowerText.startsWith('translate to french')) {
        const translator = await loadModel('translator');
        if (!translator) response = "Translation model is not available.";
        else {
            const textToTranslate = message.substring('translate to french'.length).trim();
            const result = await translator(textToTranslate);
            response = `French translation: ${result[0].translation_text}`;
        }
    } else {
        // For general conversation, use the improved mainController
        response = await mainController(message);
    }
    
    hideLoading();
    addMessage(response, "note");
  });

  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        const imageUrl = e.target.result;
        addImageMessage(imageUrl, "user");
        showLoading();
        const response = await mainController("[User uploaded an image]", imageUrl);
        hideLoading();
        addMessage(response, "note");
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

  modeToggleBtn.addEventListener('click', () => {
    isEducationalMode = !isEducationalMode;
    const icon = modeToggleBtn.querySelector('i');
    icon.classList.toggle('fa-brain', !isEducationalMode);
    icon.classList.toggle('fa-graduation-cap', isEducationalMode);
    modeToggleBtn.title = isEducationalMode ? 'Switch to Casual Mode' : 'Switch to Educational Mode';
    addMessage(isEducationalMode ? "Educational Mode enabled." : "Casual Mode enabled.", "note");
  });
});
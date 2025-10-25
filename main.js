
// ===================================================================
// NOTE - Cosmic Midnight (main.js)
// This file contains all the logic for the application.
// It is designed to be robust, clear, and fully functional.
// ===================================================================

// Wait for the entire HTML document to be loaded and parsed before running any script.
document.addEventListener("DOMContentLoaded", async function() {

    // --- 1. ELEMENT AND VARIABLE INITIALIZATION ---
    // Grab all the necessary DOM elements and initialize global state variables.

    // Core UI Elements
    const chatContainer = document.getElementById("chat-container");
    const chatDiv = document.getElementById("chat");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    const modeToggleBtn = document.getElementById("modeToggleBtn");

    // Application State Variables
    let isEducationalMode = false; // Toggles between 'casual' and 'educational' AI responses.
    let messageIdCounter = 0; // Unique ID for messages, useful for future features.
    let conversationHistory = []; // Stores the history of the current chat session.
    let activeLoadingProcesses = 0; // Counter to manage the loading indicator.
    let isLiteMode = false; // Flag to indicate if the main AI model has failed and we are in a fallback mode.

    // AI Model Management
    let models = {}; // Object to hold the loaded AI models.
    let modelStatus = { // Object to track the loading status of each model.
        translator: 'idle',
        captioner: 'idle',
        detector: 'idle',
        sentiment: 'idle',
        qa: 'idle',
        generator: 'idle'
    };

    // Configuration for all the AI models we intend to use.
    const modelConfigs = {
        translator: { task: 'translation', modelId: 'Xenova/opus-mt-en-fr' },
        captioner: { task: 'image-to-text', modelId: 'Xenova/blip-image-captioning-base' },
        detector: { task: 'object-detection', modelId: 'Xenova/detr-resnet-50' },
        sentiment: { task: 'text-classification', modelId: 'Xenova/distilbert-base-uncased-finetuned-sst-2-english' },
        qa: { task: 'question-answering', modelId: 'Xenova/distilbert-base-cased-distilled-squad' },
        generator: { task: 'text2text-generation', modelId: 'Xenova/flan-t5-small' }
    };

    // This object holds all the content processed during the session.
    // It acts as the application's "memory".
    let noteContent = {
        text: "",
        images: [],
        extractedText: [],
        summaries: [],
        actionItems: [],
        multimodalDescriptions: []
    };

    // The system prompt that defines the AI's personality and purpose.
    const systemPrompt = `You are NOTE, an intelligent assistant that helps users understand and interact with their notes. 
    You have access to the user's current note content, which may include text, images, and extracted information.
    Always provide accurate, helpful responses based on the available content.
    When citing information, reference the source (e.g., "from your notes" or "from Wikipedia").
    Maintain a professional, helpful tone.`;

    // --- 2. INITIAL APPLICATION SETUP ---
    // Display the welcome message and set up all event listeners.

    // Display the initial welcome message to the user.
    addMessage("Hello! I'm NOTE. I can process your notes, images, and queries. Upload an image or type a message to begin.", "note");

    // Function to attach all event listeners to UI elements.
    function setupEventListeners() {
        // Send button click event
        sendBtn.addEventListener('click', handleUserInput);
        // Input field 'Enter' key press event
        userInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Prevent new line in input
                handleUserInput();
            }
        });
        // Upload button click event (triggers the hidden file input)
        uploadBtn.addEventListener('click', () => fileInput.click());
        // File input change event (when a user selects a file)
        fileInput.addEventListener('change', handleFileUpload);
        // Scroll to bottom button click event
        scrollToBottomBtn.addEventListener('click', () => {
            chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        });
        // Mode toggle button click event
        modeToggleBtn.addEventListener('click', toggleConversationMode);
        // Chat container scroll event (to show/hide the scroll-to-bottom button)
        chatContainer.addEventListener('scroll', handleScroll);
    }

    // Call the setup function to activate all listeners.
    setupEventListeners();


    // --- 3. CORE HELPER FUNCTIONS ---
    // These functions handle UI updates, loading states, and message creation.

    /**
     * Adds a new message to the chat UI.
     * @param {string} text - The content of the message.
     * @param {string} sender - The sender of the message ('note' or 'user').
     * @param {string} extraClass - Any additional CSS classes for the message element.
     * @returns {HTMLElement} The created message DOM element.
     */
    function addMessage(text, sender, extraClass = '') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (extraClass) messageDiv.classList.add(extraClass);

        const bubbleDiv = document.createElement('div');
        bubbleDiv.classList.add('message-bubble');
        // Use innerHTML to allow for rendering HTML like charts
        bubbleDiv.innerHTML = text;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timestampSpan = document.createElement('span');
        timestampSpan.classList.add('timestamp');
        timestampSpan.textContent = timestamp;

        messageDiv.appendChild(bubbleDiv);
        messageDiv.appendChild(timestampSpan);
        chatDiv.appendChild(messageDiv);

        // Auto-scroll to the latest message
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        return messageDiv;
    }

    /**
     * Manages the loading indicator. Shows it when a process starts and hides it when all are done.
     */
    function manageLoadingIndicator() {
        const loader = chatDiv.querySelector('.loading-indicator-wrapper');
        if (activeLoadingProcesses > 0 && !loader) {
            // Show loader
            const loaderDiv = document.createElement('div');
            loaderDiv.classList.add('message', 'note', 'loading-indicator-wrapper');
            loaderDiv.innerHTML = `<div class="loading-indicator"><svg class="infinity-loader" viewBox="0 0 100 40"><path d="M20,20 Q30,5 40,20 T60,20 T80,20" /></svg></div>`;
            chatDiv.appendChild(loaderDiv);
            chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        } else if (activeLoadingProcesses <= 0 && loader) {
            // Hide loader
            loader.remove();
        }
    }
    function showLoading() {
        activeLoadingProcesses++;
        manageLoadingIndicator();
    }
    function hideLoading() {
        // Ensure count doesn't go below zero
        if (activeLoadingProcesses > 0) {
            activeLoadingProcesses--;
        }
        manageLoadingIndicator();
    }

    /**
     * Updates the conversation history, keeping it to a manageable size.
     * @param {string} role - 'user' or 'assistant'.
     * @param {string} content - The message content.
     */
    function updateConversationHistory(role, content) {
        conversationHistory.push({ role, content, timestamp: Date.now() });
        // Keep only the last 20 messages to avoid context overflow for the AI model.
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }
    }

    /**
     * Handles the visibility of the 'scroll to bottom' button based on scroll position.
     */
    function handleScroll() {
        const isAtBottom = chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 50;
        if (isAtBottom) {
            scrollToBottomBtn.classList.add('hidden');
        } else {
            scrollToBottomBtn.classList.remove('hidden');
        }
    }

    /**
     * Toggles the application mode between 'casual' and 'educational'.
     */
    function toggleConversationMode() {
        isEducationalMode = !isEducationalMode;
        const modeText = isEducationalMode ? 'Educational Mode' : 'Casual Mode';
        const modeIcon = isEducationalMode ? 'fa-graduation-cap' : 'fa-brain';
        modeToggleBtn.innerHTML = `<i class="fas ${modeIcon}"></i>`;
        addMessage(`Switched to ${modeText}.`, "note", "assistant-highlight");
    }


    // --- 4. AI MODEL MANAGEMENT ---
    // Functions to load, retry, and check the status of AI models.

    /**
     * Asynchronously loads a specific AI model from the Transformers.js library.
     * Includes timeout, retry logic, and fallback to 'Lite Mode'.
     * @param {string} modelName - The name of the model to load (e.g., 'generator').
     * @param {boolean} isRetry - Flag to indicate if this is a retry attempt.
     * @returns {Promise<Object|null>} The loaded model pipeline or null if it fails.
     */
    async function loadModel(modelName, isRetry = false) {
        // If model is already loaded, return it immediately.
        if (modelStatus[modelName] === 'ready') return models[modelName];
        // If model is currently loading, don't try again.
        if (modelStatus[modelName] === 'loading') return null;

        const config = modelConfigs[modelName];
        if (!config) {
            console.error(`Configuration for model "${modelName}" not found.`);
            return null;
        }

        // Reset status if this is a manual retry
        if (isRetry) modelStatus[modelName] = 'idle';
        
        modelStatus[modelName] = 'loading';
        showLoading();

        try {
            // Set a timeout for model loading to prevent hanging indefinitely.
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Model loading timed out after 90 seconds.')), 90000)
            );
            
            // Race the model loading against the timeout.
            const model = await Promise.race([
                pipeline(config.task, config.modelId),
                timeoutPromise
            ]);

            models[modelName] = model;
            modelStatus[modelName] = 'ready';
            hideLoading();

            // If the main generator model was loaded successfully after being in lite mode, restore full functionality.
            if (modelName === 'generator' && isLiteMode) {
                isLiteMode = false;
                addMessage("✅ Full AI capabilities restored!", "note");
            }
            return model;

        } catch (error) {
            modelStatus[modelName] = 'retry'; // Set status to allow manual retries.
            console.error(`Failed to load ${modelName} model:`, error);
            hideLoading();

            // Special handling for the main generator model failure.
            if (modelName === 'generator' && !isLiteMode) {
                isLiteMode = true;
                addMessage("⚠️ My advanced AI model failed to load. I'm switching to Lite Mode for basic responses. Type 'retry generator' to try loading it again.", "note", "assistant-highlight");
            } else {
                addMessage(`Error: The ${modelName} model failed to load. Type 'retry ${modelName}' to try again.`, "note");
            }
            return null;
        }
    }


    // --- 5. CORE FEATURE HANDLERS ---
    // These functions implement the main features of the application.

    /**
     * Handles the file upload process. Reads the image data and triggers processing.
     * @param {Event} event - The file input change event.
     */
    async function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            addMessage("Please upload an image file.", "note");
            return;
        }

        // Display the uploaded image in the chat immediately.
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageHtml = `<img src="${e.target.result}" alt="Uploaded Image" class="message-image">`;
            addMessage(imageHtml, "user");
        };
        reader.readAsDataURL(file);

        // Start the aggressive content processing pipeline.
        await processUploadedContent(file);
        
        // Reset the file input to allow uploading the same file again.
        fileInput.value = '';
    }

    /**
     * Aggressively processes an uploaded image using multiple AI models.
     * This is a complex, multi-step process.
     * @param {File} file - The image file to process.
     */
    async function processUploadedContent(file) {
        showLoading();
        noteContent.images.push(file); // Store the raw file object.

        // --- Step 1: OCR (Text Extraction) ---
        // Use Tesseract.js to extract text from the image.
        try {
            const ocrResult = await Tesseract.recognize(file, 'eng', {
                logger: m => console.log(m) // Log progress for debugging
            });
            const extractedText = ocrResult.data.text;
            if (extractedText.trim()) {
                noteContent.extractedText.push(extractedText);
                addMessage(`🔎 I extracted this text from the image:`, "note");
                addMessage(extractedText, "note", "ocr-result");
            }
        } catch (error) {
            console.error("OCR failed:", error);
            addMessage("⚠️ I couldn't extract any text from the image.", "note");
        }

        // --- Step 2: Image Captioning & Object Detection ---
        // Use Transformers.js to understand what's in the image.
        try {
            // Load the captioner model if not already loaded.
            const captioner = await loadModel('captioner');
            if (captioner) {
                // Read the image as a URL for the model.
                const imageUrl = URL.createObjectURL(file);
                const captionResult = await captioner(imageUrl);
                const caption = captionResult[0].generated_text;
                noteContent.multimodalDescriptions.push(caption);
                addMessage(`🖼️ Image Description: ${caption}`, "note");
                URL.revokeObjectURL(imageUrl); // Clean up object URL
            }
        } catch (error) {
            console.error("Image captioning failed:", error);
        }

        // --- Step 3: AI-Powered Summarization and Action Item Extraction ---
        // Use the main generator model to process the extracted text.
        const latestExtractedText = noteContent.extractedText[noteContent.extractedText.length - 1];
        if (latestExtractedText && latestExtractedText.trim()) {
            try {
                const generator = await loadModel('generator');
                if (generator) {
                    // Generate a summary of the extracted text.
                    const summaryPrompt = `Summarize the following text in a few bullet points:\n\n${latestExtractedText}`;
                    const summaryResult = await generator(summaryPrompt, { max_new_tokens: 150 });
                    const summary = summaryResult[0].generated_text;
                    noteContent.summaries.push(summary);
                    addMessage(`📝 Summary of extracted text:`, "note");
                    addMessage(summary, "note");

                    // Extract action items from the extracted text.
                    const actionPrompt = `Extract any action items, tasks, or to-dos from the following text. List them clearly. If there are none, say "No action items found."\n\n${latestExtractedText}`;
                    const actionResult = await generator(actionPrompt, { max_new_tokens: 150 });
                    const actionItems = actionResult[0].generated_text;
                    if (actionItems.toLowerCase().includes("no action items found")) {
                        addMessage(`📋 No clear action items were found in the text.`, "note");
                    } else {
                        noteContent.actionItems.push(actionItems);
                        addMessage(`✅ Action Items Found:`, "note");
                        addMessage(actionItems, "note");
                    }
                }
            } catch (error) {
                console.error("AI summarization/action extraction failed:", error);
                addMessage("⚠️ I had trouble generating a summary or finding action items.", "note");
            }
        }
        
        hideLoading();
        addMessage("✅ I have finished processing the image. You can now ask me questions about it.", "note", "assistant-highlight");
    }

    /**
     * Fetches a summary from Wikipedia for a given query.
     * @param {string} query - The search term for Wikipedia.
     * @returns {Promise<string>} The extracted summary or an error message.
     */
    async function handleWikipedia(query) {
        showLoading();
        try {
            // First, try to get a direct summary for the query.
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const summaryResponse = await fetch(summaryUrl);

            if (summaryResponse.ok) {
                const data = await summaryResponse.json();
                hideLoading();
                return data.extract || "I found a Wikipedia page, but it doesn't have a readable summary.";
            } else {
                // If direct summary fails, search for the topic and use the first result.
                const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
                const searchResponse = await fetch(searchUrl);
                const searchData = await searchResponse.json();

                if (searchData.query && searchData.query.search.length > 0) {
                    const title = searchData.query.search[0].title;
                    // Recursively call the function with the found title.
                    return await handleWikipedia(title);
                } else {
                    hideLoading();
                    return `Sorry, I couldn't find a Wikipedia article for "${query}".`;
                }
            }
        } catch (error) {
            console.error("Wikipedia API error:", error);
            hideLoading();
            return `Sorry, I had trouble accessing Wikipedia. Please check your connection.`;
        }
    }

    /**
     * Evaluates a mathematical expression using the Math.js library.
     * @param {string} expression - The mathematical expression to evaluate.
     * @returns {string} The result or an error message.
     */
    function handleMath(expression) {
        try {
            const result = math.evaluate(expression);
            return `The result is: ${result}`;
        } catch (error) {
            return 'Invalid mathematical expression. Please check your syntax and try again.';
        }
    }

    /**
     * Creates and displays a chart using the Chart.js library.
     * @param {string} dataString - The chart data in 'label:value, label:value' format.
     */
    function handleChart(dataString) {
        const dataPairs = dataString.split(',');
        const labels = [];
        const data = [];

        // Parse the data string into labels and values.
        for (const pair of dataPairs) {
            const [label, value] = pair.split(':').map(s => s.trim());
            if (label && !isNaN(value)) {
                labels.push(label);
                data.push(parseFloat(value));
            }
        }

        if (labels.length === 0) {
            addMessage("Invalid chart data. Please use the format: 'label:value, label:value'", "note");
            return;
        }

        // Create a message element to hold the chart.
        const messageElement = addMessage("", "note");
        const bubble = messageElement.querySelector('.message-bubble');
        bubble.textContent = "Here is your chart:";

        // Create a canvas element for the chart.
        const canvas = document.createElement('canvas');
        bubble.appendChild(canvas);

        // Initialize and render the chart.
        new Chart(canvas, {
            type: 'bar', // Default to bar chart
            data: {
                labels: labels,
                datasets: [{
                    label: 'Data',
                    data: data,
                    backgroundColor: 'rgba(224, 230, 241, 0.5)',
                    borderColor: 'rgba(224, 230, 241, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#b8c5d6' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#b8c5d6' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#b8c5d6' }
                    }
                }
            }
        });
    }


    // --- 6. MAIN AI RESPONSE GENERATION ---
    // This is the core logic for generating responses to user queries.

    /**
     * Classifies the user's intent to determine which feature to use.
     * @param {string} input - The user's input string.
     * @returns {string} The classified intent ('chat', 'math', 'wiki', 'chart', 'translate').
     */
    function classifyIntent(input) {
        const lowerInput = input.toLowerCase().trim();
        if (lowerInput.startsWith('math:')) return 'math';
        if (lowerInput.startsWith('wiki:')) return 'wiki';
        if (lowerInput.startsWith('chart:')) return 'chart';
        if (lowerInput.startsWith('translate to')) return 'translate';
        return 'chat'; // Default to general chat
    }

    /**
     * Generates an AI response based on user input and the current context.
     * This is the main brain of the assistant.
     * @param {string} userInput - The user's input text.
     */
    async function generateResponse(userInput) {
        showLoading();
        const intent = classifyIntent(userInput);
        let responseText = '';

        // --- Handle Special Command Intents ---
        if (intent === 'math') {
            const expression = userInput.substring(5).trim();
            responseText = handleMath(expression);
            hideLoading();
            addMessage(responseText, "note", "math-solution");
            updateConversationHistory('assistant', responseText);
            return;
        }

        if (intent === 'chart') {
            const dataString = userInput.substring(6).trim();
            handleChart(dataString);
            hideLoading();
            updateConversationHistory('assistant', 'Chart generated.');
            return;
        }
        
        if (intent === 'wiki') {
            const query = userInput.substring(5).trim();
            const wikiSummary = await handleWikipedia(query);
            responseText = `Here is what I found on Wikipedia about "${query}":\n\n${wikiSummary}`;
            hideLoading();
            addMessage(responseText, "note");
            updateConversationHistory('assistant', responseText);
            return;
        }

        // --- Handle General Chat/Research Intent ---
        // This is the most complex part, where we use the main AI model.
        try {
            const generator = await loadModel('generator');
            if (!generator) {
                // Fallback for when the generator model is not available (Lite Mode).
                responseText = isLiteMode 
                    ? "I'm currently in Lite Mode and can't generate complex responses. Please type 'retry generator' to restore my full capabilities."
                    : "My main AI model is not available right now. Please try again in a moment.";
                hideLoading();
                addMessage(responseText, "note");
                updateConversationHistory('assistant', responseText);
                return;
            }

            // --- Context Gathering ---
            // Gather all relevant information to give the AI the best possible context.
            let contextText = "";
            if (noteContent.text) contextText += `User's Notes Text:\n${noteContent.text}\n\n`;
            if (noteContent.extractedText.length > 0) contextText += `Text Extracted from Images:\n${noteContent.extractedText.join('\n---\n')}\n\n`;
            if (noteContent.summaries.length > 0) contextText += `Summaries of Extracted Text:\n${noteContent.summaries.join('\n---\n')}\n\n`;
            if (noteContent.multimodalDescriptions.length > 0) contextText += `Image Descriptions:\n${noteContent.multimodalDescriptions.join('\n')}\n\n`;
            
            // --- Wikipedia Integration for Research ---
            // If the user is asking a question, try to supplement with Wikipedia info.
            let wikipediaInfo = "";
            if (isEducationalMode || userInput.includes("?") || userInput.toLowerCase().startsWith("what is") || userInput.toLowerCase().startsWith("who is")) {
                // Simple heuristic to decide if a query is research-oriented.
                const searchQuery = userInput.replace("?", "").trim();
                addMessage(`🔍 Searching Wikipedia for "${searchQuery}" to provide more context...`, "note");
                wikipediaInfo = await handleWikipedia(searchQuery);
            }

            // --- Prompt Construction ---
            // Build the final prompt for the AI model.
            let finalPrompt = `${systemPrompt}\n\n`;
            finalPrompt += `Conversation History:\n${conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}\n\n`;
            if (contextText) {
                finalPrompt += `--- Available Context from User's Notes ---\n${contextText}\n--- End of Context ---\n\n`;
            }
            if (wikipediaInfo) {
                finalPrompt += `--- Information from Wikipedia ---\n${wikipediaInfo}\n--- End of Wikipedia Info ---\n\n`;
            }
            finalPrompt += `User's Latest Message: "${userInput}"\n\n`;
            finalPrompt += `Based on all the information above, provide a helpful and comprehensive response to the user's latest message.`;

            // --- Generate and Stream Response ---
            // Call the AI model and stream the response to the UI.
            const streamResponse = await generator(finalPrompt, { 
                max_new_tokens: 512, // Allow for longer responses
                stream: true 
            });

            const streamingMessage = addStreamingMessage("", "note");
            let fullResponse = "";

            // Read the stream chunk by chunk.
            for await (const chunk of streamResponse) {
                fullResponse += chunk.text;
                streamingMessage.appendText(chunk.text);
            }

            hideLoading();
            updateConversationHistory('assistant', fullResponse);

        } catch (error) {
            console.error("AI response generation failed:", error);
            hideLoading();
            addMessage("I'm sorry, I encountered an error while trying to generate a response. Please try again.", "note");
        }
    }


    // --- 7. MAIN USER INPUT HANDLER ---
    // The central function that handles all user input from the chat box.

    /**
     * The main handler for processing user input from the chat interface.
     */
    async function handleUserInput() {
        const inputText = userInput.value.trim();
        if (!inputText) return; // Do nothing if input is empty

        // Add user's message to the chat and history.
        addMessage(inputText, 'user');
        updateConversationHistory('user', inputText);
        userInput.value = ''; // Clear the input field

        // Handle special non-AI commands first.
        const lowerInput = inputText.toLowerCase();
        if (lowerInput === 'help') {
            const helpText = `
                <b>NOTE Commands:</b><br>
                - <b>math: [expression]</b> - Calculates a mathematical expression (e.g., math: sqrt(25) + 5*2).<br>
                - <b>wiki: [topic]</b> - Fetches a summary from Wikipedia (e.g., wiki: Albert Einstein).<br>
                - <b>chart: [data]</b> - Creates a bar chart (e.g., chart: Apples:10, Oranges:15, Bananas:8).<br>
                - <b>translate to [language] [text]</b> - Translates text (e.g., translate to french Hello world).<br>
                - <b>status</b> - Shows the status of all AI models.<br>
                - <b>free memory</b> - Unloads all AI models to free up browser memory.<br>
                - <b>retry [modelname]</b> - Attempts to reload a failed model (e.g., retry generator).<br>
                - Just type a message or question to chat with me!
            `;
            addMessage(helpText, "note");
            return;
        }

        if (lowerInput === 'status') {
            let statusText = "<b>AI Model Status:</b><br>";
            for (const model in modelStatus) {
                const status = modelStatus[model];
                const icon = status === 'ready' ? '✅' : status === 'loading' ? '⏳' : status === 'retry' ? '🔄' : '⚪';
                statusText += `${icon} <b>${model.charAt(0).toUpperCase() + model.slice(1)}:</b> ${status}<br>`;
            }
            statusText += `<br>Current Mode: ${isEducationalMode ? 'Educational' : 'Casual'}`;
            addMessage(statusText, "note");
            return;
        }

        if (lowerInput === 'free memory') {
            for (const modelName in models) {
                models[modelName] = null;
                modelStatus[modelName] = 'idle';
            }
            addMessage("✅ All AI models have been unloaded from memory. Type a command to reload them as needed.", "note", "assistant-highlight");
            return;
        }

        if (lowerInput.startsWith('retry ')) {
            const modelNameToRetry = lowerInput.substring(6).trim();
            if (modelConfigs[modelNameToRetry]) {
                addMessage(`Attempting to reload the ${modelNameToRetry} model...`, "note");
                await loadModel(modelNameToRetry, true); // The 'true' flag indicates a manual retry.
            } else {
                addMessage(`I don't know a model named "${modelNameToRetry}". Available models: ${Object.keys(modelConfigs).join(', ')}.`, "note");
            }
            return;
        }
        
        // If not a special command, proceed to generate an AI response.
        await generateResponse(inputText);
    }

});



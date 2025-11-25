// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- KNOWLEDGE MANAGEMENT SYSTEM ---
    // =========================================================================
    
    class KnowledgeManager {
        constructor() {
            this.knowledgeBase = {};
            this.triggerIndex = new Map();
            this.replyIndex = new Set();
            this.stats = {
                totalTopics: 0,
                totalTriggers: 0,
                totalReplies: 0,
                duplicatesRemoved: 0,
                filesLoaded: 0
            };
        }

        // Add a new topic with validation
        addTopic(topicName, topicData) {
            try {
                // Validate topic data
                if (!topicData.triggers || !topicData.replies) {
                    throw new Error(`Topic '${topicName}' must have triggers and replies arrays`);
                }

                // Clean and validate triggers
                const cleanTriggers = [...new Set(topicData.triggers.map(t => t.toLowerCase().trim()))];
                if (cleanTriggers.length === 0) {
                    throw new Error(`Topic '${topicName}' must have at least one valid trigger`);
                }

                // Clean and validate replies
                const cleanReplies = this.removeDuplicateReplies(topicData.replies);
                if (cleanReplies.length === 0) {
                    throw new Error(`Topic '${topicName}' must have at least one valid reply`);
                }

                // Add to knowledge base
                this.knowledgeBase[topicName] = {
                    triggers: cleanTriggers,
                    replies: cleanReplies,
                    priority: topicData.priority || 1,
                    category: topicData.category || 'general'
                };

                // Update indexes
                this.updateIndexes(topicName, cleanTriggers);
                
                // Update stats
                this.stats.totalTopics++;
                this.stats.totalTriggers += cleanTriggers.length;
                this.stats.totalReplies += cleanReplies.length;

                return true;
            } catch (error) {
                console.error(`Error adding topic '${topicName}':`, error.message);
                return false;
            }
        }

        // Remove duplicate replies
        removeDuplicateReplies(replies) {
            const uniqueReplies = [];
            const seen = new Set();

            for (const reply of replies) {
                const cleanReply = reply.trim();
                if (cleanReply && !seen.has(cleanReply.toLowerCase())) {
                    uniqueReplies.push(cleanReply);
                    seen.add(cleanReply.toLowerCase());
                } else if (cleanReply && seen.has(cleanReply.toLowerCase())) {
                    this.stats.duplicatesRemoved++;
                    console.warn(`Duplicate reply removed: "${cleanReply}"`);
                }
            }

            return uniqueReplies;
        }

        // Update search indexes for performance
        updateIndexes(topicName, triggers) {
            for (const trigger of triggers) {
                if (!this.triggerIndex.has(trigger)) {
                    this.triggerIndex.set(trigger, []);
                }
                this.triggerIndex.get(trigger).push(topicName);
            }
        }

        // Find best matching topic
        findMatchingTopic(userMessage) {
            const words = userMessage.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const topicMatches = new Map();

            // Check each word against triggers
            for (const word of words) {
                if (this.triggerIndex.has(word)) {
                    const topics = this.triggerIndex.get(word);
                    for (const topic of topics) {
                        topicMatches.set(topic, (topicMatches.get(topic) || 0) + 1);
                    }
                }
            }

            // Check full phrases
            for (const [trigger, topics] of this.triggerIndex) {
                if (userMessage.toLowerCase().includes(trigger)) {
                    for (const topic of topics) {
                        topicMatches.set(topic, (topicMatches.get(topic) || 0) + 2); // Higher weight for phrases
                    }
                }
            }

            // Find best match
            let bestTopic = null;
            let bestScore = 0;

            for (const [topic, score] of topicMatches) {
                const priority = this.knowledgeBase[topic].priority || 1;
                const finalScore = score * priority;
                
                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestTopic = topic;
                }
            }

            return bestTopic;
        }

        // Get statistics
        getStats() {
            return { ...this.stats };
        }
    }

    // =========================================================================
    // --- CHATBOT CORE FUNCTIONALITY ---
    // =========================================================================

    // Get references to all necessary HTML elements
    const chatContainer = document.getElementById('chat-container');
    const chatDiv = document.getElementById('chat');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typing-indicator');

    // Initialize knowledge manager
    const knowledgeManager = new KnowledgeManager();
    let messageIdCounter = 0;
    let isProcessing = false;
    let conversationHistory = [];

    // --- LOAD KNOWLEDGE FROM FILES ---
    async function loadKnowledgeFromFiles() {
        const files = [
            { name: 'conversations', url: './conversations.json' },
            { name: 'information', url: './information.json' }
        ];

        for (const file of files) {
            try {
                console.log(`Loading ${file.name}.json...`);
                
                const response = await fetch(file.url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Add all topics from this file
                let topicsAdded = 0;
                for (const [topicName, topicData] of Object.entries(data)) {
                    topicData.category = file.name;
                    if (knowledgeManager.addTopic(topicName, topicData)) {
                        topicsAdded++;
                    }
                }
                
                knowledgeManager.stats.filesLoaded++;
                console.log(`✅ ${file.name}.json loaded: ${topicsAdded} topics`);
                
            } catch (error) {
                console.error(`❌ Failed to load ${file.name}.json:`, error);
                
                // Add fallback content if file fails to load
                if (file.name === 'conversations') {
                    addFallbackConversations();
                } else if (file.name === 'information') {
                    addFallbackInformation();
                }
            }
        }
    }

    // --- FALLBACK CONTENT (if files fail to load) ---
    function addFallbackConversations() {
        knowledgeManager.addTopic('greeting', {
            triggers: ["hello", "hi", "hey"],
            replies: ["Hello! How can I help you?"],
            category: 'conversations'
        });
        
        knowledgeManager.addTopic('help', {
            triggers: ["help"],
            replies: ["I can help with various topics. Try asking me something!"],
            category: 'conversations'
        });
    }

    function addFallbackInformation() {
        knowledgeManager.addTopic('default_info', {
            triggers: ["what", "who", "how"],
            replies: ["I'm having trouble accessing my knowledge base right now."],
            category: 'information'
        });
    }

    // --- FUNCTION TO ADD A MESSAGE TO THE CHAT ---
    function addMessage(text, sender, isError = false) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender);
            if (isError) messageDiv.classList.add('error');
            messageDiv.setAttribute('id', `message-${messageIdCounter++}`);

            const bubbleDiv = document.createElement('div');
            bubbleDiv.classList.add('message-bubble');
            bubbleDiv.textContent = text;

            const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('timestamp');
            timestampSpan.textContent = timestamp;

            messageDiv.appendChild(bubbleDiv);
            messageDiv.appendChild(timestampSpan);
            chatDiv.appendChild(messageDiv);

            // Add to conversation history
            conversationHistory.push({
                text: text,
                sender: sender,
                timestamp: new Date().toISOString(),
                id: messageIdCounter - 1
            });

            // Keep only last 100 messages in memory
            if (conversationHistory.length > 100) {
                conversationHistory.shift();
            }

            // Scroll to the bottom
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);

        } catch (error) {
            console.error('Error adding message:', error);
        }
    }

    // --- FUNCTION TO GENERATE A BOT RESPONSE ---
    function generateResponse(userMessage) {
        try {
            // Find matching topic
            const matchedTopic = knowledgeManager.findMatchingTopic(userMessage);
            
            if (matchedTopic && knowledgeManager.knowledgeBase[matchedTopic]) {
                const topicData = knowledgeManager.knowledgeBase[matchedTopic];
                const randomIndex = Math.floor(Math.random() * topicData.replies.length);
                return topicData.replies[randomIndex];
            }

            // Return default response
            return "I'm not sure I understand. Can you try rephrasing that? You can type 'help' to see what I can talk about!";

        } catch (error) {
            console.error('Error generating response:', error);
            return "I'm having trouble processing that. Could you try again?";
        }
    }

    // --- FUNCTION TO HANDLE SENDING A MESSAGE ---
    async function handleSendMessage() {
        const messageText = userInput.value.trim();

        // Validation
        if (messageText === '' || isProcessing) {
            return;
        }

        // Set processing state
        isProcessing = true;
        sendBtn.disabled = true;

        try {
            // Add user message
            addMessage(messageText, 'user');
            userInput.value = '';

            // Show typing indicator
            typingIndicator.style.display = 'flex';

            // Simulate processing delay
            setTimeout(() => {
                try {
                    typingIndicator.style.display = 'none';
                    const botResponse = generateResponse(messageText);
                    addMessage(botResponse, 'note');
                } catch (error) {
                    typingIndicator.style.display = 'none';
                    addMessage("I'm having trouble thinking right now. Let's try that again.", 'note');
                    console.error('Response error:', error);
                } finally {
                    isProcessing = false;
                    sendBtn.disabled = false;
                    userInput.focus();
                }
            }, 1000 + Math.random() * 1000);

        } catch (error) {
            addMessage("Failed to send message. Please try again.", 'note');
            isProcessing = false;
            sendBtn.disabled = false;
            console.error('Send error:', error);
        }
    }

    // --- EVENT LISTENERS ---
    sendBtn.addEventListener('click', (event) => {
        event.preventDefault();
        handleSendMessage();
    });

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    });

    userInput.addEventListener('input', () => {
        sendBtn.disabled = userInput.value.trim() === '' || isProcessing;
    });

    // --- DEBUG COMMANDS ---
    userInput.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'd') {
            event.preventDefault();
            const stats = knowledgeManager.getStats();
            addMessage(`Stats: ${stats.totalTopics} topics, ${stats.totalTriggers} triggers, ${stats.totalReplies} replies, ${stats.filesLoaded} files loaded`, 'note');
        }
    });

    // --- INITIALIZATION ---
    async function initializeChat() {
        try {
            // Show loading message
            addMessage("Loading my knowledge base...", 'note');
            
            // Load knowledge from files
            await loadKnowledgeFromFiles();
            
            // Remove loading message
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Loading my knowledge base")) {
                loadingMessage.remove();
            }
            
            // Add welcome message
            addMessage("Hello! I'm NOTE, your virtual assistant. Type 'help' to see what I can do!", 'note');
            
            // Focus input
            userInput.focus();
            sendBtn.disabled = false;

            // Log initialization
            console.log('[NOTE] Chatbot initialized successfully');
            console.log('[NOTE] Knowledge Base Stats:', knowledgeManager.getStats());

        } catch (error) {
            // Remove loading message if it exists
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Loading my knowledge base")) {
                loadingMessage.remove();
            }
            
            addMessage("Failed to initialize properly. Some features may not work.", 'note', true);
            console.error('Initialization error:', error);
        }
    }

    // Start the chatbot
    initializeChat();

});

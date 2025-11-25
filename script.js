// Wait for HTML document to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- INTELLIGENT AI WITH DUAL LEARNING SYSTEM ---
    // =========================================================================
    
    class IntelligentNoteAI {
        constructor() {
            this.knowledgeBase = [];
            this.conversationHistory = [];
            this.responsePatterns = new Map();
            this.conceptNetwork = new Map();
            this.wordVectors = new Map();
            this.userProfiles = new Map();
            this.learningPatterns = new Map();
            this.currentUserId = 'user_' + Date.now();
            
            this.stats = {
                totalKnowledge: 0,
                conversationsProcessed: 0,
                responsesGenerated: 0,
                newConceptsLearned: 0
            };
            
            this.initializeSystem();
        }

        // Initialize the system
        async initializeSystem() {
            // Load both knowledge and conversations
            await Promise.all([
                this.loadKnowledgeFromFile('./information.json'),
                this.loadConversationsFromFile('./conversations.json')
            ]);
            
            // Initialize response patterns
            this.initializeResponsePatterns();
            
            console.log('NOTE AI initialized with dual learning capabilities');
        }

        // Load knowledge from information file
        async loadKnowledgeFromFile(filePath) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Process all knowledge items
                let itemsProcessed = 0;
                for (const [topicName, content] of Object.entries(data)) {
                    if (this.processKnowledgeItem(topicName, content)) {
                        itemsProcessed++;
                    }
                }
                
                console.log(`✅ Loaded ${itemsProcessed} knowledge items from ${filePath}`);
                this.stats.totalKnowledge = itemsProcessed;
                return itemsProcessed;
            } catch (error) {
                console.error(`❌ Failed to load knowledge from ${filePath}:`, error);
                return 0;
            }
        }

        // Load conversations from file
        async loadConversationsFromFile(filePath) {
            try {
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                // Process all conversations
                let conversationsProcessed = 0;
                for (const conversation of data) {
                    if (this.processConversation(conversation)) {
                        conversationsProcessed++;
                    }
                }
                
                console.log(`✅ Loaded ${conversationsProcessed} conversations from ${filePath}`);
                this.stats.conversationsProcessed = conversationsProcessed;
                return conversationsProcessed;
            } catch (error) {
                console.error(`❌ Failed to load conversations from ${filePath}:`, error);
                return 0;
            }
        }

        // Process a conversation
        processConversation(conversation) {
            try {
                // Add to conversation history
                this.conversationHistory.push(conversation);
                
                // Extract learning patterns from this conversation
                this.extractLearningPatterns(conversation);
                
                // Update user profile if available
                if (conversation.userId) {
                    this.updateUserProfile(conversation);
                }
                
                return true;
            } catch (error) {
                console.error(`Error processing conversation:`, error.message);
                return false;
            }
        }

        // Extract learning patterns from conversations
        extractLearningPatterns(conversation) {
            if (!conversation.messages) return;
            
            for (const message of conversation.messages) {
                if (message.sender === 'user') {
                    // Extract question patterns
                    const questionType = this.detectQuestionType(message.text);
                    if (questionType) {
                        this.updateQuestionPattern(questionType, message.text);
                    }
                    
                    // Extract response patterns
                    if (conversation.botResponse) {
                        this.updateResponsePattern(message.text, conversation.botResponse);
                    }
                }
            }
        }

        // Generate intelligent response based on both knowledge and conversation learning
        generateIntelligentResponse(userMessage) {
            try {
                // Parse user message
                const parsedMessage = this.parseMessage(userMessage);
                
                // Determine intent
                const intent = this.determineIntent(parsedMessage);
                
                // Generate response based on intent
                let response;
                
                switch (intent.type) {
                    case 'question':
                        response = this.answerQuestion(parsedMessage, intent);
                        break;
                    case 'command':
                        response = this.handleCommand(parsedMessage, intent);
                        break;
                    case 'greeting':
                        response = this.generateGreeting();
                        break;
                    case 'farewell':
                        response = this.generateFarewell();
                        break;
                    case 'thanks':
                        response = this.generateThanksResponse();
                        break;
                    case 'help':
                        response = this.generateHelpResponse();
                        break;
                    default:
                        response = this.generateConversationalResponse(parsedMessage);
                }
                
                // Update response history
                this.updateResponseHistory(userMessage, response, intent);
                
                // Update stats
                this.stats.responsesGenerated++;
                
                return response;
            } catch (error) {
                console.error('Error generating intelligent response:', error);
                return "I'm having trouble understanding that. Could you try rephrasing?";
            }
        }

        // Answer questions using both knowledge and conversation learning
        answerQuestion(parsedMessage, intent) {
            const questionType = parsedMessage.questionType;
            const keywords = parsedMessage.keywords;
            
            // First, try to find exact matches in knowledge base
            const exactMatches = this.findExactKnowledgeMatches(keywords);
            
            if (exactMatches.length > 0) {
                return this.generateAnswerFromKnowledge(exactMatches[0], questionType, keywords);
            }
            
            // Next, try to find conceptual matches
            const conceptualMatches = this.findConceptualKnowledgeMatches(keywords);
            
            if (conceptualMatches.length > 0) {
                return this.generateAnswerFromKnowledge(conceptualMatches[0], questionType, keywords);
            }
            
            // Try to use learned patterns from conversations
            const learnedResponse = this.generateLearnedResponse(questionType, keywords);
            
            if (learnedResponse) {
                return learnedResponse;
            }
            
            // If no match found, generate a response based on what we know
            return this.generateKnowledgeGapResponse(questionType, keywords);
        }

        // Generate learned response based on conversation patterns
        generateLearnedResponse(questionType, keywords) {
            if (!this.learningPatterns.has(questionType)) {
                return null;
            }
            
            const patterns = this.learningPatterns.get(questionType);
            
            // Find patterns that match our keywords
            const matchingPatterns = patterns.filter(pattern => {
                let matchCount = 0;
                for (const keyword of keywords) {
                    if (pattern.keywords.includes(keyword)) {
                        matchCount++;
                    }
                }
                return matchCount > 0;
            });
            
            if (matchingPatterns.length === 0) {
                return null;
            }
            
            // Sort by match count
            matchingPatterns.sort((a, b) => {
                const aMatches = a.keywords.filter(k => keywords.includes(k)).length;
                const bMatches = b.keywords.filter(k => keywords.includes(k)).length;
                return bMatches - aMatches;
            });
            
            // Generate response based on best matching pattern
            const bestPattern = matchingPatterns[0];
            
            // Try to generate a new response by adapting the pattern
            const newResponse = this.generateResponseFromPattern(bestPattern, keywords);
            
            if (newResponse) {
                // Learn this new response
                this.learningPatterns.get(questionType).push({
                    question: `Generated for ${keywords.join(' ')}`,
                    response: newResponse,
                    keywords: keywords,
                    concepts: this.extractConcepts(newResponse)
                });
                
                this.stats.newConceptsLearned++;
                
                return newResponse;
            }
            
            // Return original response if can't generate new one
            return bestPattern.response;
        }

        // Generate response from pattern
        generateResponseFromPattern(learnedResponse, keywords) {
            // This is a simplified pattern-based response generation
            // In a real system, you'd use more sophisticated NLP
            
            const questionWords = learnedResponse.question.split(' ');
            const responseWords = learnedResponse.response.split(' ');
            
            // Try to substitute keywords
            let newResponse = learnedResponse.response;
            
            for (let i = 0; i < questionWords.length; i++) {
                const questionWord = questionWords[i];
                
                // Find corresponding word in response
                for (let j = 0; j < responseWords.length; j++) {
                    if (this.areWordsSimilar(questionWord, responseWords[j])) {
                        // Try to find a replacement
                        const replacement = this.findReplacementWord(responseWords, j, keywords);
                        if (replacement) {
                            responseWords[j] = replacement;
                            newResponse = responseWords.join(' ');
                            break;
                        }
                    }
                }
            }
            
            // Check if response changed significantly
            const originalWords = learnedResponse.response.split(' ');
            let changesCount = 0;
            
            for (let i = 0; i < originalWords.length; i++) {
                if (originalWords[i] !== responseWords[i]) {
                    changesCount++;
                }
            }
            
            // If enough changes were made, return new response
            if (changesCount >= originalWords.length * 0.3) {
                return newResponse;
            }
            
            return null;
        }

        // Helper methods (same as before)
        parseMessage(message) {
            return {
                original: message,
                words: this.extractWords(message),
                keywords: this.extractKeywords(message),
                concepts: this.extractConcepts(message),
                questionType: this.detectQuestionType(message)
            };
        }

        extractWords(text) {
            return text.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 1);
        }

        extractKeywords(text) {
            const words = this.extractWords(text);
            const stopWords = new Set([
                'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 
                'been', 'be', 'have', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 
                'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 
                'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 
                'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 
                'some', 'such', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just'
            ]);
            
            // Count word frequency
            const wordCount = {};
            for (const word of words) {
                if (!stopWords.has(word) && word.length > 2) {
                    wordCount[word] = (wordCount[word] || 0) + 1;
                }
            }
            
            // Sort by frequency and return top keywords
            return Object.entries(wordCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(entry => entry[0]);
        }

        // Other helper methods (same as before)
        extractConcepts(text) {
            const words = this.extractWords(text);
            const concepts = [];
            
            // Simple noun phrase extraction
            for (let i = 0; i < words.length - 1; i++) {
                if (this.isNoun(words[i]) && this.isNoun(words[i + 1])) {
                    concepts.push(`${words[i]} ${words[i + 1]}`);
                } else if (this.isNoun(words[i])) {
                    concepts.push(words[i]);
                }
            }
            
            return concepts;
        }

        detectQuestionType(message) {
            const questionPatterns = this.responsePatterns.get('questionTypes');
            
            for (const [type, pattern] of questionPatterns) {
                if (pattern.test(message)) {
                    return type;
                }
            }
            
            return 'unknown';
        }

        // Other methods (same as before)
        initializeResponsePatterns() {
            this.responsePatterns.set('questionTypes', {
                what: /what (is|are|was|were|do|does|did)/gi,
                who: /who (is|are|was|were|do|does|did)/gi,
                when: /when (is|are|was|were|do|does|did)/gi,
                where: /where (is|are|was|were|do|does|did)/gi,
                why: /why (is|are|was|were|do|does|did)/gi,
                how: /how (is|are|was|were|do|does|did)/gi,
                compare: /which (is|are|better|worse|more|less)/gi,
                explain: /explain|describe|tell me about/gi
            });
        }

        // Other methods (same as before)
        generateGreeting() {
            const greetings = [
                "Hello! How can I assist you today?",
                "Hi there! What can I do for you?",
                "Greetings! What's on your mind?",
                "Hey! I'm here to help. What do you need?"
            ];
            
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Other methods (same as before)
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        // Save conversations to file
        async saveConversationsToFile() {
            try {
                // In a real implementation, this would save to a server
                // For demo purposes, we'll just log it
                console.log('Saving conversation history:', this.conversationHistory);
                
                // Simulate file save
                const conversationData = {
                    conversations: this.conversationHistory,
                    timestamp: new Date().toISOString()
                };
                
                // In a real app, you'd send this to a server
                // fetch('/api/save-conversations', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(conversationData)
                // });
                
                return true;
            } catch (error) {
                console.error('Error saving conversations:', error);
                return false;
            }
        }

        // Other methods (same as before)
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

    // Initialize intelligent AI
    const intelligentAI = new IntelligentNoteAI();
    let messageIdCounter = 0;
    let isProcessing = false;

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

            // Scroll to bottom
            setTimeout(() => {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 100);

        } catch (error) {
            console.error('Error adding message:', error);
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
                    
                    // Generate intelligent response
                    const botResponse = intelligentAI.generateIntelligentResponse(messageText);
                    addMessage(botResponse, 'note');
                    
                } catch (error) {
                    typingIndicator.style.display = 'none';
                    addMessage("I'm having trouble understanding that. Could you try rephrasing?", 'note');
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
            const stats = intelligentAI.getStats();
            addMessage(`AI Stats: ${stats.totalKnowledge} knowledge items, ${stats.conversationsProcessed} conversations processed, ${stats.responsesGenerated} responses generated, ${stats.newConceptsLearned} new concepts learned`, 'note');
        }
        
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            intelligentAI.saveConversationsToFile();
            addMessage("I've saved our conversation to my memory.", 'note');
        }
    });

    // --- INITIALIZATION ---
    async function initializeChat() {
        try {
            // Show loading message
            addMessage("Initializing my systems and loading knowledge...", 'note');
            
            // Initialize the AI system
            await intelligentAI.initializeSystem();
            
            // Remove loading message
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Initializing my systems")) {
                loadingMessage.remove();
            }
            
            // Add welcome message
            addMessage("Hello! I'm NOTE, an intelligent AI that learns from both information and conversations. I'm ready to help!", 'note');
            
            // Focus input
            userInput.focus();
            sendBtn.disabled = false;

            // Log initialization
            console.log('[NOTE] Intelligent AI initialized successfully');
            console.log('[NOTE] AI Stats:', intelligentAI.getStats());

        } catch (error) {
            // Remove loading message if it exists
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Initializing my systems")) {
                loadingMessage.remove();
            }
            
            addMessage("Failed to initialize properly. Some features may not work.", 'note', true);
            console.error('Initialization error:', error);
        }
    }

    // Start chatbot
    initializeChat();

});

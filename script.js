
// Wait for HTML document to be fully loaded before running script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- INTELLIGENT AI WITH DUAL LEARNING SYSTEM ---
    // =========================================================================
    
    class IntelligentNoteAI {
        constructor() {
            this.knowledgeBase = new Map();
            this.conversationHistory = [];
            this.responsePatterns = new Map();
            this.conceptNetwork = new Map();
            this.wordVectors = new Map();
            this.userProfiles = new Map();
            this.learningPatterns = new Map();
            this.currentUserId = 'user_' + Date.now();
            this.waitingForInfo = false;
            this.pendingTopic = null;
            
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
                this.loadKnowledgeFromData(window.informationData),
                this.loadConversationsFromData(window.conversationsData)
            ]);
            
            // Initialize response patterns
            this.initializeResponsePatterns();
            
            console.log('NOTE AI initialized with dual learning capabilities');
        }

        // Load knowledge from data object
        async loadKnowledgeFromData(data) {
            try {
                if (!data) {
                    console.warn('No information data available');
                    return 0;
                }
                
                // Process all knowledge items
                let itemsProcessed = 0;
                for (const [topicName, content] of Object.entries(data)) {
                    if (this.processKnowledgeItem(topicName, content)) {
                        itemsProcessed++;
                    }
                }
                
                console.log(`✅ Loaded ${itemsProcessed} knowledge items`);
                this.stats.totalKnowledge = itemsProcessed;
                return itemsProcessed;
            } catch (error) {
                console.error(`❌ Failed to load knowledge:`, error);
                return 0;
            }
        }

        // Load conversations from data object
        async loadConversationsFromData(data) {
            try {
                if (!data) {
                    console.warn('No conversation data available');
                    return 0;
                }
                
                // Process all conversations
                let conversationsProcessed = 0;
                for (const conversation of data) {
                    if (this.processConversation(conversation)) {
                        conversationsProcessed++;
                    }
                }
                
                console.log(`✅ Loaded ${conversationsProcessed} conversations`);
                this.stats.conversationsProcessed = conversationsProcessed;
                return conversationsProcessed;
            } catch (error) {
                console.error(`❌ Failed to load conversations:`, error);
                return 0;
            }
        }

        // Process a knowledge item
        processKnowledgeItem(topicName, content) {
            try {
                // Store in knowledge base
                this.knowledgeBase.set(topicName.toLowerCase(), {
                    title: topicName,
                    content: content,
                    keywords: this.extractKeywords(content),
                    concepts: this.extractConcepts(content)
                });
                
                // Update concept network
                const concepts = this.extractConcepts(content);
                for (const concept of concepts) {
                    if (!this.conceptNetwork.has(concept)) {
                        this.conceptNetwork.set(concept, []);
                    }
                    this.conceptNetwork.get(concept).push(topicName.toLowerCase());
                }
                
                return true;
            } catch (error) {
                console.error(`Error processing knowledge item "${topicName}":`, error.message);
                return false;
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
            
            for (let i = 0; i < conversation.messages.length; i++) {
                const message = conversation.messages[i];
                if (message.sender === 'user') {
                    // Extract question patterns
                    const questionType = this.detectQuestionType(message.text);
                    if (questionType) {
                        this.updateQuestionPattern(questionType, message.text);
                    }
                    
                    // Extract response patterns
                    if (i < conversation.messages.length - 1 && conversation.messages[i+1].sender === 'note') {
                        this.updateResponsePattern(message.text, conversation.messages[i+1].text);
                    }
                }
            }
        }

        // Update question pattern
        updateQuestionPattern(questionType, question) {
            if (!this.learningPatterns.has(questionType)) {
                this.learningPatterns.set(questionType, []);
            }
            
            const keywords = this.extractKeywords(question);
            this.learningPatterns.get(questionType).push({
                question: question,
                keywords: keywords,
                concepts: this.extractConcepts(question)
            });
        }

        // Update response pattern
        updateResponsePattern(question, response) {
            const questionType = this.detectQuestionType(question);
            if (!questionType) return;
            
            if (!this.learningPatterns.has(questionType)) {
                this.learningPatterns.set(questionType, []);
            }
            
            const keywords = this.extractKeywords(question);
            this.learningPatterns.get(questionType).push({
                question: question,
                response: response,
                keywords: keywords,
                concepts: this.extractConcepts(response)
            });
        }

        // Generate intelligent response based on both knowledge and conversation learning
        generateIntelligentResponse(userMessage) {
            try {
                // Check if we're waiting for information
                if (this.waitingForInfo) {
                    return this.processNewInformation(userMessage);
                }
                
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

        // Process new information provided by user
        processNewInformation(userMessage) {
            if (!this.pendingTopic) {
                this.waitingForInfo = false;
                return "I seem to have forgotten what topic we were discussing. Please try again.";
            }
            
            // Add to knowledge base
            this.processKnowledgeItem(this.pendingTopic, userMessage);
            
            // Reset state
            this.waitingForInfo = false;
            const topic = this.pendingTopic;
            this.pendingTopic = null;
            
            // Update stats
            this.stats.totalKnowledge++;
            this.stats.newConceptsLearned++;
            
            return `Thank you! I've learned about "${topic}". I can now answer questions about this topic.`;
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

        // Find exact knowledge matches
        findExactKnowledgeMatches(keywords) {
            const matches = [];
            
            for (const keyword of keywords) {
                if (this.knowledgeBase.has(keyword)) {
                    matches.push(this.knowledgeBase.get(keyword));
                }
            }
            
            return matches;
        }

        // Find conceptual knowledge matches
        findConceptualKnowledgeMatches(keywords) {
            const matches = [];
            const keywordSet = new Set(keywords);
            
            for (const [topic, data] of this.knowledgeBase) {
                let matchScore = 0;
                
                // Check keyword overlap
                for (const keyword of data.keywords) {
                    if (keywordSet.has(keyword)) {
                        matchScore++;
                    }
                }
                
                // Check concept overlap
                for (const concept of data.concepts) {
                    if (keywordSet.has(concept)) {
                        matchScore += 2; // Concepts weigh more
                    }
                }
                
                if (matchScore > 0) {
                    matches.push({ ...data, matchScore });
                }
            }
            
            // Sort by match score
            return matches.sort((a, b) => b.matchScore - a.matchScore);
        }

        // Generate answer from knowledge
        generateAnswerFromKnowledge(knowledgeItem, questionType, keywords) {
            // Simple answer generation - in a real system, this would be more sophisticated
            let answer = knowledgeItem.content;
            
            // If the answer is too long, truncate it
            if (answer.length > 500) {
                answer = answer.substring(0, 497) + "...";
            }
            
            return answer;
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
            
            // Return the best matching response
            return matchingPatterns[0].response || 
                   `Based on my learning, ${matchingPatterns[0].question} relates to topics we've discussed before.`;
        }

        // Generate response when knowledge gap is detected
        generateKnowledgeGapResponse(questionType, keywords) {
            // Try to identify the main topic
            const mainTopic = keywords[0];
            
            if (mainTopic) {
                return `I don't have information about "${mainTopic}" yet. Would you like to teach me about it? Just say "tell me about [topic]" and I'll ask you for information.`;
            }
            
            return "I don't have information on that topic. Could you provide more details or ask about something else?";
        }

        // Handle commands
        handleCommand(parsedMessage, intent) {
            const command = intent.command;
            
            switch (command) {
                case 'add_info':
                    return this.prepareToAddInformation(parsedMessage);
                case 'stats':
                    return this.getStatsResponse();
                case 'help':
                    return this.generateHelpResponse();
                default:
                    return "I'm not sure how to handle that command. Type 'help' for available commands.";
            }
        }

        // Prepare to add new information
        prepareToAddInformation(parsedMessage) {
            const keywords = parsedMessage.keywords;
            
            if (keywords.length === 0) {
                return "What topic would you like to teach me about? Please specify a topic.";
            }
            
            // Set state to wait for information
            this.waitingForInfo = true;
            this.pendingTopic = keywords[0];
            
            return `Great! Please tell me about "${this.pendingTopic}". I'll learn from what you provide.`;
        }

        // Get stats response
        getStatsResponse() {
            return `I currently know about ${this.stats.totalKnowledge} topics, have processed ${this.stats.conversationsProcessed} conversations, generated ${this.stats.responsesGenerated} responses, and learned ${this.stats.newConceptsLearned} new concepts from our interactions.`;
        }

        // Determine intent from parsed message
        determineIntent(parsedMessage) {
            const text = parsedMessage.original.toLowerCase();
            
            // Check for commands
            if (text.includes('add') && (text.includes('information') || text.includes('info'))) {
                return { type: 'command', command: 'add_info' };
            }
            
            if (text.includes('stats') || text.includes('statistics')) {
                return { type: 'command', command: 'stats' };
            }
            
            // Check for greetings
            if (text.match(/^(hi|hello|hey|greetings)/)) {
                return { type: 'greeting' };
            }
            
            // Check for farewells
            if (text.match(/^(bye|goodbye|see you|farewell)/)) {
                return { type: 'farewell' };
            }
            
            // Check for thanks
            if (text.match(/^(thank|thanks|thank you)/)) {
                return { type: 'thanks' };
            }
            
            // Check for help
            if (text.match(/^(help|assist|support)/)) {
                return { type: 'help' };
            }
            
            // Check for questions
            if (text.includes('?') || text.match(/^(what|who|when|where|why|how|tell|explain|describe)/)) {
                return { type: 'question', questionType: parsedMessage.questionType };
            }
            
            // Default to conversational
            return { type: 'conversational' };
        }

        // Generate greeting response
        generateGreeting() {
            const greetings = [
                "Hello! How can I assist you today?",
                "Hi there! What can I do for you?",
                "Greetings! What's on your mind?",
                "Hey! I'm here to help. What do you need?"
            ];
            
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // Generate farewell response
        generateFarewell() {
            const farewells = [
                "Goodbye! It was nice chatting with you.",
                "See you later! Feel free to come back anytime.",
                "Farewell! Have a great day!",
                "Bye! Don't hesitate to return if you need more help."
            ];
            
            return farewells[Math.floor(Math.random() * farewells.length)];
        }

        // Generate thanks response
        generateThanksResponse() {
            const thanks = [
                "You're welcome! Is there anything else I can help with?",
                "My pleasure! Happy to assist.",
                "No problem at all! What else would you like to know?",
                "Glad I could help! Feel free to ask more questions."
            ];
            
            return thanks[Math.floor(Math.random() * thanks.length)];
        }

        // Generate help response
        generateHelpResponse() {
            return `I'm NOTE, an intelligent AI that learns from both information and conversations. You can:
            - Ask me questions about topics I know
            - Teach me new information by saying "add info about [topic]"
            - Ask for my stats by saying "stats"
            - Just have a conversation with me!
            
            I'm always learning, so the more you interact with me, the smarter I become.`;
        }

        // Generate conversational response
        generateConversationalResponse(parsedMessage) {
            const conversationalResponses = [
                "That's interesting. Tell me more.",
                "I see. How does that relate to what you were asking about?",
                "I'm not sure I understand completely. Could you elaborate?",
                "That's a fascinating point. What else can you tell me?",
                "I'm processing what you said. Can you provide more context?"
            ];
            
            return conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
        }

        // Update response history
        updateResponseHistory(userMessage, response, intent) {
            // Add to conversation history
            this.conversationHistory.push({
                userId: this.currentUserId,
                timestamp: new Date().toISOString(),
                messages: [
                    {
                        sender: 'user',
                        text: userMessage,
                        timestamp: new Date().toISOString()
                    },
                    {
                        sender: 'note',
                        text: response,
                        timestamp: new Date().toISOString()
                    }
                ],
                intent: intent
            });
            
            // Extract learning patterns from this conversation
            this.extractLearningPatterns({
                userId: this.currentUserId,
                messages: [
                    {
                        sender: 'user',
                        text: userMessage,
                        timestamp: new Date().toISOString()
                    },
                    {
                        sender: 'note',
                        text: response,
                        timestamp: new Date().toISOString()
                    }
                ]
            });
        }

        // Update user profile
        updateUserProfile(conversation) {
            if (!this.userProfiles.has(conversation.userId)) {
                this.userProfiles.set(conversation.userId, {
                    firstSeen: conversation.timestamp,
                    lastSeen: conversation.timestamp,
                    messageCount: 0,
                    topics: new Set()
                });
            }
            
            const profile = this.userProfiles.get(conversation.userId);
            profile.lastSeen = conversation.timestamp;
            profile.messageCount += conversation.messages.length;
            
            // Extract topics from conversation
            for (const message of conversation.messages) {
                if (message.sender === 'user') {
                    const concepts = this.extractConcepts(message.text);
                    for (const concept of concepts) {
                        profile.topics.add(concept);
                    }
                }
            }
        }

        // Helper methods
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

        isNoun(word) {
            // Simple heuristic for noun detection
            // In a real system, you'd use a proper NLP library
            const commonNouns = new Set([
                'einstein', 'curie', 'gravity', 'quantum', 'computing', 'intelligence', 'artificial',
                'physics', 'science', 'theory', 'relativity', 'energy', 'mass', 'force', 'particle',
                'radioactivity', 'element', 'isotope', 'photon', 'electron', 'atom', 'molecule',
                'algorithm', 'data', 'information', 'knowledge', 'learning', 'network', 'system'
            ]);
            
            return commonNouns.has(word) || word.length > 6; // Longer words are more likely to be nouns
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
                
                // Save to localStorage for persistence
                localStorage.setItem('note_conversations', JSON.stringify(conversationData));
                
                return true;
            } catch (error) {
                console.error('Error saving conversations:', error);
                return false;
            }
        }

        // Save knowledge to file
        async saveKnowledgeToFile() {
            try {
                // Convert Map to object
                const knowledgeObject = {};
                for (const [key, value] of this.knowledgeBase) {
                    knowledgeObject[key] = value.content;
                }
                
                // Save to localStorage for persistence
                localStorage.setItem('note_knowledge', JSON.stringify(knowledgeObject));
                
                return true;
            } catch (error) {
                console.error('Error saving knowledge:', error);
                return false;
            }
        }

        // Load conversations from localStorage
        async loadConversationsFromStorage() {
            try {
                const savedConversations = localStorage.getItem('note_conversations');
                if (savedConversations) {
                    const data = JSON.parse(savedConversations);
                    if (data.conversations && Array.isArray(data.conversations)) {
                        await this.loadConversationsFromData(data.conversations);
                    }
                }
                return true;
            } catch (error) {
                console.error('Error loading conversations from storage:', error);
                return false;
            }
        }

        // Load knowledge from localStorage
        async loadKnowledgeFromStorage() {
            try {
                const savedKnowledge = localStorage.getItem('note_knowledge');
                if (savedKnowledge) {
                    const data = JSON.parse(savedKnowledge);
                    await this.loadKnowledgeFromData(data);
                }
                return true;
            } catch (error) {
                console.error('Error loading knowledge from storage:', error);
                return false;
            }
        }

        // Get stats
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
            Promise.all([
                intelligentAI.saveConversationsToFile(),
                intelligentAI.saveKnowledgeToFile()
            ]).then(() => {
                addMessage("I've saved our conversation and knowledge to my memory.", 'note');
            }).catch(error => {
                addMessage("Failed to save to memory.", 'note');
                console.error('Save error:', error);
            });
        }
    });

    // --- INITIALIZATION ---
    async function initializeChat() {
        try {
            // Show loading message
            addMessage("Initializing my systems and loading knowledge...", 'note');
            
            // Load from localStorage first
            await Promise.all([
                intelligentAI.loadKnowledgeFromStorage(),
                intelligentAI.loadConversationsFromStorage()
            ]);
            
            // Initialize the AI system with default data
            await intelligentAI.initializeSystem();
            
            // Remove loading message
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Initializing my systems")) {
                loadingMessage.remove();
            }
            
            // Add welcome message
            addMessage("Hello! I'm NOTE, an intelligent AI that learns from both information and conversations. You can teach me new topics by saying 'add info about [topic]'. I'm ready to help!", 'note');
            
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

    // Auto-save before page unload
    window.addEventListener('beforeunload', () => {
        Promise.all([
            intelligentAI.saveConversationsToFile(),
            intelligentAI.saveKnowledgeToFile()
        ]).catch(error => {
            console.error('Auto-save error:', error);
        });
    });

    // Start chatbot
    initializeChat();

});
```


document.addEventListener("DOMContentLoaded", function() {
    // =========================================================================
    // --- BOT CONFIGURATION: ADD YOUR REPLIES HERE ---
    // =========================================================================

    const botReplies = {
        // --- GREETINGS ---
        'greeting': {
            triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
            replies: [
                "Hello! How can I assist you today?",
                "Hi there! What can I do for you?",
                "Hey! Ready to answer your questions."
            ]
        },
        // --- BASIC CONVERSATION ---
        'well_being': {
            triggers: ['how are you', 'how are you doing'],
            replies: [
                "I'm operating at full capacity, thank you for asking!",
                "I'm just a program, but I'm doing great! How about you?",
                "All systems are running smoothly. I'm ready to help!"
            ]
        },
        'purpose': {
            triggers: ['what is your purpose', 'what do you do', 'who are you'],
            replies: [
                "My name is NOTE. I'm an intelligent assistant designed to provide information and chat with you.",
                "I'm here to answer your questions and offer assistance. Think of me as your digital helper.",
                "My purpose is to make your life easier by providing quick and accurate information."
            ]
        },
        'thanks': {
            triggers: ['thank you', 'thanks', 'thx'],
            replies: [
                "You're welcome! I'm happy to help.",
                "Anytime! Let me know if you need anything else.",
                "My pleasure!"
            ]
        },
        // --- COMMON KNOWLEDGE ---
        'einstein': {
            triggers: ['who is albert einstein', 'albert einstein', 'einstein'],
            replies: [
                "Albert Einstein was a German-born theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics. His work is also known for its influence on the philosophy of science."
            ]
        },
        'capital_france': {
            triggers: ['capital of france', 'what is the capital of france', 'paris'],
            replies: [
                "The capital of France is Paris.",
                "It's Paris, the city of light!"
            ]
        },
        'largest_ocean': {
            triggers: ['largest ocean', 'biggest ocean', 'pacific ocean'],
            replies: [
                "The Pacific Ocean is the largest and deepest of the world's five oceans."
            ]
        },
        // --- IMPORTANT INFORMATION ---
        'privacy': {
            triggers: ['privacy', 'do you store my data'],
            replies: [
                "I do not store any of your personal data. Our conversations are temporary and are not saved or shared.",
                "Your privacy is important. I am a client-side application, meaning I don't send or store your information on any server."
            ]
        }
    };

    // --- DEFAULT REPLIES (When the bot doesn't understand) ---
    const defaultReplies = [
        "I'm not sure I understand. Can you try rephrasing that?",
        "That's an interesting question. I don't have an answer for it right now.",
        "My knowledge is limited. Could you ask something else?",
        "I'm still learning. I didn't get that. Can you try again?"
    ];

    // =========================================================================
    // --- BOT BRAINS (DO NOT EDIT BELOW THIS LINE) ---
    // =========================================================================

    const chatContainer = document.getElementById("chat-container");
    const chatDiv = document.getElementById("chat");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    let messageIdCounter = 0;

    // --- Loading Indicator Functions ---
    function showLoading() { 
        hideLoading(); 
        const loaderDiv = document.createElement('div'); 
        loaderDiv.classList.add('message', 'note', 'loading-indicator-wrapper'); 
        loaderDiv.innerHTML = `<div class="loading-indicator"><svg class="infinity-loader" viewBox="0 0 100 40"><path d="M20,20 Q30,5 40,20 T60,20 T80,20" /></svg></div>`; 
        chatDiv.appendChild(loaderDiv); 
        chatContainer.scrollTop = chatContainer.scrollHeight; 
    }
    function hideLoading() { 
        const existingLoader = chatDiv.querySelector('.loading-indicator-wrapper'); 
        if (existingLoader) { existingLoader.remove(); } 
    }

    // --- Message Sending & Response Logic ---
    const generateResponse = (userMessage) => {
        const lowerCaseMessage = userMessage.toLowerCase();
        for (const topic in botReplies) {
            const { triggers, replies } = botReplies[topic];
            for (const trigger of triggers) {
                if (lowerCaseMessage.includes(trigger)) {
                    const randomIndex = Math.floor(Math.random() * replies.length);
                    return replies[randomIndex];
                }
            }
        }
        const randomDefaultIndex = Math.floor(Math.random() * defaultReplies.length);
        return defaultReplies[randomDefaultIndex];
    };

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div'); 
        messageDiv.classList.add('message', sender);
        
        const bubbleDiv = document.createElement('div'); 
        bubbleDiv.classList.add('message-bubble'); 
        bubbleDiv.dataset.messageId = `msg-${messageIdCounter++}`;
        bubbleDiv.textContent = text;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timestampSpan = document.createElement('span'); 
        timestampSpan.classList.add('timestamp'); 
        timestampSpan.textContent = timestamp;

        messageDiv.appendChild(bubbleDiv); 
        messageDiv.appendChild(timestampSpan); 
        
        chatDiv.appendChild(messageDiv);
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        return messageDiv; // Return the element to apply highlight later
    }

    sendBtn.addEventListener("click", () => {
        const messageText = userInput.value.trim();
        if (messageText !== "") {
            addMessage(messageText, "user");
            userInput.value = '';

            showLoading();
            setTimeout(() => {
                hideLoading();
                const response = generateResponse(messageText);
                const messageElement = addMessage(response, "note");
                
                // Apply highlight for informational messages
                if (response.includes("is") || response.includes("are") || response.includes("was") || response.includes("were")) {
                    messageElement.classList.add('assistant-highlight');
                }
            }, 1500 + Math.random() * 1500);
        }
    });

    userInput.addEventListener("keypress", (event) => { if (event.key === "Enter") { sendBtn.click(); } });
});

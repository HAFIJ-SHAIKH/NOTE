document.addEventListener('DOMContentLoaded', () => {

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
        'capabilities': {
            triggers: ['what can you do', 'help', 'features'],
            replies: [
                "I can answer questions on a wide range of topics, from common knowledge to specific facts. Just ask me anything!",
                "My capabilities include providing information, having conversations, and helping you find answers. Try asking me about science, history, or famous people."
            ]
        },

        // --- COMMON KNOWLEDGE ---
        'einstein': {
            triggers: ['who is albert einstein', 'albert einstein', 'einstein'],
            replies: [
                "Albert Einstein was a German-born theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics. His work is also known for its influence on the philosophy of science."
            ]
        },
        'marie_curie': {
            triggers: ['who is marie curie', 'marie curie'],
            replies: [
                "Marie Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize and the only person to win a Nobel Prize in two different scientific fields."
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
        'speed_of_light': {
            triggers: ['speed of light', 'how fast is light'],
            replies: [
                "The speed of light in a vacuum is approximately 299,792,458 meters per second, or about 186,282 miles per second."
            ]
        },

        // --- IMPORTANT INFORMATION (General Help) ---
        'privacy': {
            triggers: ['privacy', 'do you store my data'],
            replies: [
                "I do not store any of your personal data. Our conversations are temporary and are not saved or shared.",
                "Your privacy is important. I am a client-side application, meaning I don't send or store your information on any server."
            ]
        },
        'how_to_use': {
            triggers: ['how to use you', 'how do i ask a question'],
            replies: [
                "Simply type your question into the input box at the bottom and press Enter or click the send button. I'll do my best to provide a helpful answer."
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

    const chatMessages = document.getElementById('chat-messages');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingIndicator = document.getElementById('typing-indicator');

    const addMessage = (message, sender, isError = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);

        const bubbleElement = document.createElement('div');
        bubbleElement.classList.add('message-bubble');
        bubbleElement.textContent = message;

        messageElement.appendChild(bubbleElement);
        chatMessages.appendChild(messageElement);

        if (isError) {
            messageElement.classList.add('error');
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

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

    const handleSendMessage = () => {
        const userMessage = messageInput.value.trim();
        if (userMessage === '') return;

        addMessage(userMessage, 'user');
        messageInput.value = '';
        messageInput.focus(); // Keep input focused after sending

        typingIndicator.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            typingIndicator.style.display = 'none';
            const botResponse = generateResponse(userMessage);
            const isError = defaultReplies.includes(botResponse);
            addMessage(botResponse, 'bot', isError);
        }, 1000 + Math.random() * 1000); // Variable delay for realism
    };

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

});

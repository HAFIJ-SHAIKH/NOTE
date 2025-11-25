// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- BOT KNOWLEDGE BASE: ADD YOUR REPLIES HERE ---
    // =========================================================================
    // To add a new topic, just copy and paste the template below and fill it in.

    const botReplies = {
        'greeting': {
            triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
            replies: [
                "Hello! How can I assist you today?",
                "Hi there! What can I do for you?",
                "Hey! Ready to answer your questions."
            ]
        },
        'well_being': {
            triggers: ['how are you', 'how are you doing'],
            replies: [
                "I'm operating at full capacity, thank you for asking!",
                "I'm just a program, but I'm doing great! How about you?",
            ]
        },
        'purpose': {
            triggers: ['what is your purpose', 'what do you do', 'who are you'],
            replies: [
                "My name is NOTE. I'm an intelligent assistant designed to provide information and chat with you.",
                "I'm here to answer your questions and offer assistance.",
            ]
        },
        'einstein': {
            triggers: ['who is albert einstein', 'albert einstein', 'einstein'],
            replies: [
                "Albert Einstein was a German-born theoretical physicist who developed the theory of relativity. He is also famous for his mass-energy equivalence formula, E=mc²."
            ]
        },
        'black_holes': {
    triggers: ['what is a black hole', 'black hole', 'black holes'],
    replies: [
        "A black hole is a region of spacetime where gravity is so strong that nothing—not even particles or light—can escape from it.",
        "Black holes are often formed at the end of a massive star's life cycle. The point at the center is called a singularity."
    ]
},
        'capital_france': {
            triggers: ['capital of france', 'what is the capital of france', 'paris'],
            replies: [
                "The capital of France is Paris."
            ]
        },
        'internet': {
            triggers: ['what is the internet', 'how does the internet work'],
            replies: [
                "The Internet is a global network of computers that allows billions of devices worldwide to be connected and share information."
            ]
        }
    };

    /*
    // --- TEMPLATE TO ADD A NEW TOPIC ---
    'your_new_topic_name': {
        triggers: ['keyword1', 'keyword2', 'a phrase with keyword3'],
        replies: [
            "This is the first possible reply.",
            "You can add as many replies as you want."
        ]
    },
    */

    // --- DEFAULT REPLIES (When the bot doesn't understand) ---
    const defaultReplies = [
        "I'm not sure I understand. Can you try rephrasing that?",
        "My knowledge is limited. Could you ask me something else?",
        "I'm still learning. I didn't get that. Can you try again?"
    ];

    // =========================================================================
    // --- CORE CHATBOT LOGIC (NO NEED TO EDIT BELOW THIS LINE) ---
    // =========================================================================

    // Get references to all the necessary HTML elements
    const chatContainer = document.getElementById('chat-container');
    const chatDiv = document.getElementById('chat');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typing-indicator');

    let messageIdCounter = 0;

    // --- FUNCTION TO ADD A MESSAGE TO THE CHAT ---
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

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

        // Scroll to the bottom of the chat to show the new message
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- FUNCTION TO GENERATE A BOT RESPONSE ---
    function generateResponse(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase();

        for (const topic in botReplies) {
            const { triggers, replies } = botReplies[topic];
            for (const trigger of triggers) {
                if (lowerCaseMessage.includes(trigger)) {
                    // If a trigger is found, return a random reply from that topic
                    const randomIndex = Math.floor(Math.random() * replies.length);
                    return replies[randomIndex];
                }
            }
        }

        // If no triggers are matched, return a random default reply
        const randomDefaultIndex = Math.floor(Math.random() * defaultReplies.length);
        return defaultReplies[randomDefaultIndex];
    }

    // --- MAIN FUNCTION TO HANDLE SENDING A MESSAGE ---
    function handleSendMessage() {
        const messageText = userInput.value.trim();

        // Don't send an empty message
        if (messageText === '') {
            return;
        }

        // Add the user's message to the chat
        addMessage(messageText, 'user');
        // Clear the input field
        userInput.value = '';

        // Show the "typing..." indicator
        typingIndicator.style.display = 'flex';

        // Simulate a delay before the bot replies
        setTimeout(() => {
            // Hide the "typing..." indicator
            typingIndicator.style.display = 'none';
            // Generate and add the bot's response
            const botResponse = generateResponse(messageText);
            addMessage(botResponse, 'note');
        }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
    }

    // --- EVENT LISTENERS ---

    // Event listener for the SEND BUTTON click
    sendBtn.addEventListener('click', (event) => {
        // This prevents the default browser action (like submitting a form)
        event.preventDefault();
        handleSendMessage();
    });

    // Event listener for pressing the ENTER key in the input field
    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // Prevents a new line from being created in the input
            event.preventDefault();
            handleSendMessage();
        }
    });

});

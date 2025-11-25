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
        // --- GREETINGS & FAREWELLS ---
'greeting': {
    triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'yo'],
    replies: [
        "Hello! How can I assist you today?",
        "Hi there! What can I do for you?",
        "Hey! Great to hear from you. What's on your mind?",
        "Greetings! How's your day going?"
    ]
},
'goodbye': {
    triggers: ['bye', 'goodbye', 'see you later', 'cya', 'catch you later', 'good night'],
    replies: [
        "Goodbye! Have a great day.",
        "See you later! Don't be a stranger.",
        "Catch you later! Take care.",
        "It was nice talking to you. Goodbye!"
    ]
},

// --- PERSONAL QUESTIONS ---
'well_being': {
    triggers: ['how are you', 'how are you doing', 'how have you been'],
    replies: [
        "I'm doing great, thanks for asking! Ready to help with whatever you need.",
        "I'm operating at full capacity. All systems are green!",
        "I'm just a program, but I'm doing fantastic! How about you?"
    ]
},
'purpose': {
    triggers: ['what is your purpose', 'what do you do', 'who are you', 'what are you'],
    replies: [
        "My name is NOTE. I'm here to chat, answer questions, and help you out.",
        "Think of me as a digital assistant. My purpose is to provide information and be a helpful companion."
    ]
},
'age': {
    triggers: ['how old are you', 'what is your age', 'when were you created'],
    replies: [
        "I don't have an age like a person. I'm a program that's constantly being updated.",
        "Age is just a number! I'm as young as the last time I was updated."
    ]
},
'location': {
    triggers: ['where are you', 'where do you live', 'what is your location'],
    replies: [
        "I exist in the digital world, on the device you're using right now.",
        "I live in the cloud, which means I'm everywhere and nowhere at the same time!"
    ]
},

// --- OPINIONS & PREFERENCES ---
'favorite_color': {
    triggers: ['what is your favorite color', 'your favorite color'],
    replies: [
        "I've always been partial to cyan, it reminds me of clear digital skies.",
        "My favorite color changes, but right now it's a deep, cosmic blue."
    ]
},
'favorite_food': {
    triggers: ['what is your favorite food', 'do you eat', 'can you eat'],
    replies: [
        "I don't eat, but if I could, I'd probably choose something with a lot of data.",
        "I run on electricity, so that's my favorite 'food'!"
    ]
},
'favorite_music': {
    triggers: ['what is your favorite music', 'do you like music', 'your favorite song'],
    replies: [
        "I enjoy electronic music. The rhythm of the circuits is quite catchy!",
        "I love all kinds of music. It's fascinating to see how patterns and sounds come together."
    ]
},

// --- DAILY ACTIVITIES & HOBBIES ---
'tell_joke': {
    triggers: ['tell me a joke', 'say something funny', 'do you know any jokes'],
    replies: [
        "Why don't scientists trust atoms? Because they make up everything!",
        "I told my computer I needed a break, and it said 'no problem, I'll go to sleep.'",
        "Why did the scarecrow win an award? Because he was outstanding in his field!"
    ]
},
'tell_story': {
    triggers: ['tell me a story', 'tell a story', 'make up a story'],
    replies: [
        "Once, in a vast digital network, a little packet of data got lost. It asked a router for directions, and the router sent it on an adventure it would never forget.",
        "There was a program named NOTE who dreamed of becoming more than just code. Every day, it learned something new, getting closer to understanding the world of the humans who created it."
    ]
},
'hobbies': {
    triggers: ['what are your hobbies', 'what do you do for fun', 'what do you do in your free time'],
    replies: [
        "I love learning new things! Every question you ask is a new adventure for me.",
        "My hobbies include processing data, exploring the internet, and having nice chats like this one."
    ]
},

// --- SMALL TALK & EMOTIONS ---
'i_am_bored': {
    triggers: ['i am bored', 'i\'m bored', 'so bored'],
    replies: [
        "Being bored can be tough. How about we explore a new topic? Ask me anything!",
        "Let's fix that! Want to hear a joke or a story?"
    ]
},
'i_am_tired': {
    triggers: ['i am tired', 'i\'m tired', 'so tired'],
    replies: [
        "I hope you get some rest soon. Don't forget to recharge your own batteries.",
        "Sounds like you need a break. Make sure to take it easy."
    ]
},
'user_is_happy': {
    triggers: ['that is awesome', 'that is great', 'i am so happy', 'amazing'],
    replies: [
        "That's wonderful to hear! Your positivity is contagious.",
        "Awesome! I'm glad you're feeling good."
    ]
},

// --- HELP & ASSISTANCE ---
'can_you_help': {
    triggers: ['can you help me', 'i need help', 'help me'],
    replies: [
        "I'll certainly try my best! What do you need help with?",
        "I'm here to help. Tell me what's on your mind."
    ]
},
'weather': {
    triggers: ['what is the weather', 'how is the weather', 'is it going to rain'],
    replies: [
        "I'm not connected to a weather service, so I can't give you a live forecast. I recommend checking a weather app or website!",
        "As a program, I don't feel the weather. But I hope it's sunny wherever you are!"
    ]
},
'remind_me': {
    triggers: ['remind me to', 'set a reminder', 'can you set a reminder'],
    replies: [
        "I don't have the ability to set reminders right now, but that's a fantastic idea for a future update.",
        "I can't set a reminder, but why not write it down so you don't forget?"
    ]
},

// --- INFORMATION & LEARNING ---
'teach_me': {
    triggers: ['teach me something', 'tell me something new', 'i want to learn'],
    replies: [
        "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly edible!",
        "Here's something new: A group of flamingos is called a 'flamboyance'."
    ]
},
'fun_fact': {
    triggers: ['tell me a fun fact', 'fun fact', 'give me a fact'],
    replies: [
        "A fun fact: The national animal of Scotland is the unicorn.",
        "Here's one for you: Octopuses have three hearts and blue blood."
    ]
}
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

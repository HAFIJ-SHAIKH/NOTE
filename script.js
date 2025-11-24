document.addEventListener("DOMContentLoaded", function() {
    // =========================================================================
    // --- BOT CONFIGURATION: ADD YOUR REPLIES HERE ---
    // =========================================================================

    const botReplies = {
        // --- GREETINGS & BASIC CONVERSATION ---
        'greeting': {
            triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
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
                "I can answer questions on a wide range of topics. Try asking me about science, history, or geography!",
                "My knowledge base includes facts about the world, famous people, technology, and much more. Just ask away!"
            ]
        },

        // --- SCIENCE ---
        'einstein': {
            triggers: ['who is albert einstein', 'albert einstein', 'einstein', 'theory of relativity'],
            replies: [
                "Albert Einstein was a German-born theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics. He is also famous for the mass-energy equivalence formula E=mc²."
            ]
        },
        'gravity': {
            triggers: ['what is gravity', 'gravity', 'newton'],
            replies: [
                "Gravity is a fundamental force that attracts objects with mass toward each other. The more massive an object, the stronger its gravitational pull. Isaac Newton famously formulated its laws."
            ]
        },
        'photosynthesis': {
            triggers: ['what is photosynthesis', 'photosynthesis'],
            replies: [
                "Photosynthesis is the process used by plants, algae, and some bacteria to convert light energy into chemical energy. They use sunlight, water, and carbon dioxide to create their food and release oxygen."
            ]
        },
        'h2o': {
            triggers: ['what is water', 'h2o', 'chemical formula for water'],
            replies: [
                "Water is a transparent, tasteless, odorless, and nearly colorless chemical substance. Its chemical formula is H₂O, meaning each of its molecules contains one oxygen and two hydrogen atoms."
            ]
        },

        // --- GEOGRAPHY ---
        'capital_france': {
            triggers: ['capital of france', 'what is the capital of france', 'paris'],
            replies: [
                "The capital of France is Paris, known as the 'City of Light'."
            ]
        },
        'capital_japan': {
            triggers: ['capital of japan', 'what is the capital of japan', 'tokyo'],
            replies: [
                "The capital of Japan is Tokyo, a bustling metropolis."
            ]
        },
        'largest_ocean': {
            triggers: ['largest ocean', 'biggest ocean', 'pacific ocean'],
            replies: [
                "The Pacific Ocean is the largest and deepest of the world's five oceans."
            ]
        },
        'highest_mountain': {
            triggers: ['highest mountain', 'mount everest', 'tallest mountain'],
            replies: [
                "Mount Everest, located in the Himalayas, is the Earth's highest mountain above sea level."
            ]
        },
        'sahara': {
            triggers: ['sahara desert', 'largest desert'],
            replies: [
                "The Sahara Desert is the largest hot desert in the world, located in North Africa."
            ]
        },

        // --- HISTORY ---
        'marie_curie': {
            triggers: ['who is marie curie', 'marie curie'],
            replies: [
                "Marie Curie was a Polish and naturalized-French physicist and chemist who conducted pioneering research on radioactivity. She was the first woman to win a Nobel Prize and the only person to win in two different scientific fields."
            ]
        },
        'rome': {
            triggers: ['roman empire', 'ancient rome'],
            replies: [
                "The Roman Empire was one of the largest empires in history, with territories throughout Europe, North Africa, and the Middle East. It left a lasting legacy on law, language, and engineering."
            ]
        },
        'renaissance': {
            triggers: ['what was the renaissance', 'renaissance'],
            replies: [
                "The Renaissance was a fervent period of European cultural, artistic, political and economic 'rebirth' following the Middle Ages. It saw the flourishing of art, science, and literature, with figures like Leonardo da Vinci and Michelangelo."
            ]
        },
        'pyramids': {
            triggers: ['egyptian pyramids', 'pyramids of giza'],
            replies: [
                "The Pyramids of Giza are ancient pyramid structures built as tombs for pharaohs. The Great Pyramid of Giza is the oldest of the Seven Wonders of the Ancient World."
            ]
        },

        // --- TECHNOLOGY & COMPUTING ---
        'internet': {
            triggers: ['what is the internet', 'how does the internet work'],
            replies: [
                "The Internet is a global network of computers that allows billions of devices worldwide to be connected. It works by sending data in small packets across a vast network of routers and servers."
            ]
        },
        'ai': {
            triggers: ['what is artificial intelligence', 'ai', 'machine learning'],
            replies: [
                "Artificial Intelligence (AI) is a field of computer science dedicated to creating systems that can perform tasks that typically require human intelligence, such as learning, reasoning, and problem-solving."
            ]
        },
        'blockchain': {
            triggers: ['what is blockchain', 'bitcoin', 'cryptocurrency'],
            replies: [
                "A blockchain is a distributed, immutable digital ledger used to record transactions across many computers. It's the technology behind cryptocurrencies like Bitcoin."
            ]
        },
        'cloud_computing': {
            triggers: ['what is cloud computing', 'the cloud'],
            replies: [
                "Cloud computing is the delivery of computing services—including servers, storage, databases, networking, software—over the Internet ('the cloud'). It allows for flexible resources and faster innovation."
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
        return messageDiv; 
    }

    // --- Event Listener with Fix ---
    sendBtn.addEventListener("click", (event) => {
        // --- SAFETY FIX IS HERE ---
        event.preventDefault(); // This prevents any default browser action (like page reload)

        const messageText = userInput.value.trim();
        if (messageText !== "") {
            addMessage(messageText, "user");
            userInput.value = '';

            showLoading();
            setTimeout(() => {
                hideLoading();
                const response = generateResponse(messageText);
                const messageElement = addMessage(response, "note");
                
                if (response.includes("is") || response.includes("are") || response.includes("was") || response.includes("were")) {
                    messageElement.classList.add('assistant-highlight');
                }
            }, 1500 + Math.random() * 1500);
        }
    });

    userInput.addEventListener("keypress", (event) => { 
        if (event.key === "Enter") { 
            sendBtn.click(); 
        } 
    });
});

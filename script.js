// Wait for the HTML document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // --- CORE CHATBOT LOGIC (NO NEED TO EDIT BELOW THIS LINE) ---
    // =========================================================================

    // Get references to all necessary HTML elements
    const chatContainer = document.getElementById('chat-container');
    const chatDiv = document.getElementById('chat');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const typingIndicator = document.getElementById('typing-indicator');

    let botReplies = {}; // This will hold the loaded data
    let messageIdCounter = 0;

    // --- FUNCTION TO LOAD REPLIES FROM EXTERNAL JSON FILE ---
    async function loadReplies() {
        try {
            // Show a loading message in the chat while data is being fetched
            addMessage("Loading my knowledge base...", 'note');
            
            const response = await fetch('replies.json');
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            botReplies = await response.json();
            
            // Remove the loading message after data is loaded
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Loading my knowledge base")) {
                loadingMessage.remove();
            }

        } catch (error) {
            console.error("Failed to load replies:", error);
            // Remove the loading message and show an error message
            const loadingMessage = chatDiv.querySelector('.message.note');
            if (loadingMessage && loadingMessage.textContent.includes("Loading my knowledge base")) {
                loadingMessage.remove();
            }
            addMessage("Sorry, I couldn't load my knowledge. Please try refreshing the page.", 'note');
        }
    }

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
        const defaultReplies = [
            "I'm not sure I understand. Can you try rephrasing that?",
            "My knowledge is limited. Could you ask me something else?",
            "I'm still learning. I didn't get that. Can you try again?"
        ];
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

    // --- INITIALIZE THE CHATBOT ---
    // Load the replies and then set up the chat
    loadReplies().then(() => {
        // You can add a welcome message here if you want
        // addMessage("Hello! I'm ready to chat.", 'note');
    }).catch(error => {
        console.error("Initialization failed:", error);
    });

});

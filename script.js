document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('.chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.querySelector('button');
    const typingIndicator = document.querySelector('.typing-indicator');

    const addMessage = (message, sender, isError = false) => {
        const messageElement = document.createElement('li');
        if (sender === 'user') {
            messageElement.classList.add('user-message');
        } else {
            messageElement.classList.add('bot-message');
            if (isError) {
                messageElement.classList.add('error');
            }
        }
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const generateResponse = (userMessage) => {
        const lowerCaseMessage = userMessage.toLowerCase();
        if (lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hi')) {
            return "Hey! What's on your mind?";
        } else if (lowerCaseMessage.includes('how are you')) {
            return "I'm feeling electric! Thanks for asking.";
        } else if (lowerCaseMessage.includes('what is your name')) {
            return "You can call me NOTE. I'm here to chat.";
        } else if (lowerCaseMessage.includes('bye')) {
            return "Catch you later!";
        } else {
            return "Hmm, I'm not sure how to respond to that. Can you try rephrasing?";
        }
    };

    const handleSendMessage = () => {
        const userMessage = messageInput.value.trim();
        if (userMessage === '') return;

        addMessage(userMessage, 'user');
        messageInput.value = '';

        // Show typing indicator
        typingIndicator.style.display = 'flex';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            // Hide typing indicator
            typingIndicator.style.display = 'none';
            
            const botResponse = generateResponse(userMessage);
            const isError = botResponse === "Hmm, I'm not sure how to respond to that. Can you try rephrasing?";
            addMessage(botResponse, 'bot', isError);
        }, 1500); // Slightly longer delay for realism
    };

    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleSendMessage();
    });

    messageInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    });
});

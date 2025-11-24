document.addEventListener("DOMContentLoaded", function() {
    // =========================================================================
    // --- BOT CONFIGURATION: ADD YOUR REPLIES HERE ---
    // =========================================================================
    const botReplies = {
        'greeting': {
            triggers: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
            replies: ["Hello! How can I assist you today?", "Hi there! What can I do for you?", "Hey! Ready to answer your questions."]
        },
        'well_being': {
            triggers: ['how are you', 'how are you doing'],
            replies: ["I'm operating at full capacity, thank you for asking!", "I'm just a program, but I'm doing great! How about you?", "All systems are running smoothly. I'm ready to help!"]
        },
        'purpose': {
            triggers: ['what is your purpose', 'what do you do', 'who are you'],
            replies: ["My name is NOTE. I'm an intelligent assistant designed to provide information and chat with you.", "I'm here to answer your questions and offer assistance. Think of me as your digital helper.", "My purpose is to make your life easier by providing quick and accurate information."]
        },
        'thanks': {
            triggers: ['thank you', 'thanks', 'thx'],
            replies: ["You're welcome! I'm happy to help.", "Anytime! Let me know if you need anything else.", "My pleasure!"]
        },
        'einstein': {
            triggers: ['who is albert einstein', 'albert einstein', 'einstein'],
            replies: ["Albert Einstein was a German-born theoretical physicist who developed the theory of relativity, one of the two pillars of modern physics."]
        },
        'capital_france': {
            triggers: ['capital of france', 'what is the capital of france', 'paris'],
            replies: ["The capital of France is Paris.", "It's Paris, the city of light!"]
        },
        'largest_ocean': {
            triggers: ['largest ocean', 'biggest ocean', 'pacific ocean'],
            replies: ["The Pacific Ocean is the largest and deepest of the world's five oceans."]
        }
    };
    const defaultReplies = ["I'm not sure I understand. Can you try rephrasing that?", "That's an interesting question. I don't have an answer for it right now.", "My knowledge is limited. Could you ask something else?"];
    // =========================================================================
    // --- BRAINS AND UI INTEGRATION (DO NOT EDIT BELOW THIS LINE) ---
    // =========================================================================

    const chatContainer = document.getElementById("chat-container");
    const chatDiv = document.getElementById("chat");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const uploadBtn = document.getElementById("uploadBtn");
    const fileInput = document.getElementById("fileInput");
    const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
    const modeToggleBtn = document.getElementById("modeToggleBtn");
    const replyContextBar = document.getElementById("replyContextBar");
    const replyContextContent = document.querySelector('.reply-context-content');
    const replyQuoteText = document.getElementById("replyQuoteText");
    const replyQuoteSender = document.getElementById("replyQuoteSender");
    const replyCancelBtn = document.getElementById("replyCancelBtn");

    let isEducationalMode = false;
    let replyingTo = null;
    let originalMessageToReplyTo = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let currentSwipedMessage = null;
    let messageIdCounter = 0;

    // --- Mobile Swipe Gesture Logic ---
    function handleTouchStart(e) {
        const messageElement = e.target.closest('.message');
        if (!messageElement) return;
        currentSwipedMessage = messageElement;
        const touch = e.touches[0];
        touchStartX = touch.pageX;
        touchStartY = touch.pageY;
    }
    function handleTouchMove(e) {
        if (!currentSwipedMessage) return;
        const touch = e.touches[0];
        const deltaX = touch.pageX - touchStartX;
        const deltaY = touch.pageY - touchStartY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) { e.preventDefault(); currentSwipedMessage.style.transform = `translateX(${deltaX}px)`; }
    }
    function handleTouchEnd(e) {
        if (!currentSwipedMessage) return;
        const touch = e.changedTouches[0];
        const endX = touch.pageX;
        const deltaX = endX - touchStartX;
        currentSwipedMessage.style.transition = 'transform 0.2s ease-out';
        currentSwipedMessage.style.transform = 'translateX(0)';
        const isHorizontalSwipe = Math.abs(deltaX) > 50;
        if (isHorizontalSwipe) {
            const messageBubble = currentSwipedMessage.querySelector('.message-bubble');
            if (messageBubble) {
                if (currentSwipedMessage.classList.contains('note') && deltaX > 0) { showReplyContext(messageBubble.textContent, currentSwipedMessage); }
                else if (currentSwipedMessage.classList.contains('user') && deltaX < 0) { showReplyContext(messageBubble.textContent, currentSwipedMessage); }
            }
        }
        currentSwipedMessage = null;
    }
    if ('ontouchstart' in window) {
        chatDiv.addEventListener('touchstart', handleTouchStart, { passive: false });
        chatDiv.addEventListener('touchmove', handleTouchMove, { passive: false });
        chatDiv.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // --- Reply Feature Functions ---
    function showReplyContext(messageText, messageElement) {
        replyingTo = messageText;
        originalMessageToReplyTo = messageElement;
        const sender = messageElement.classList.contains('note') ? 'NOTE' : 'You';
        replyQuoteSender.textContent = `${sender}:`;
        replyQuoteText.textContent = messageText;
        replyContextBar.style.display = 'flex';
        userInput.placeholder = 'Add a reply...';
        userInput.focus();
    }
    function hideReplyContext() {
        replyingTo = null;
        originalMessageToReplyTo = null;
        replyContextBar.style.display = 'none';
        userInput.placeholder = 'Ask NOTE anything...';
    }
    replyCancelBtn.addEventListener('click', hideReplyContext);
    chatDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('reply-btn')) {
            const messageElement = e.target.closest('.message');
            const messageBubble = messageElement.querySelector('.message-bubble');
            if (messageBubble) { showReplyContext(messageBubble.textContent, messageElement); }
        }
    });
    replyContextContent.addEventListener('click', () => {
        if (originalMessageToReplyTo) {
            originalMessageToReplyTo.scrollIntoView({ behavior: 'smooth', block: 'center' });
            originalMessageToReplyTo.classList.add('original-highlight');
            setTimeout(() => { originalMessageToReplyTo.classList.remove('original-highlight'); }, 2000);
        }
    });

    // --- Loading Indicator Functions ---
    function showLoading() { hideLoading(); const loaderDiv = document.createElement('div'); loaderDiv.classList.add('message', 'note', 'loading-indicator-wrapper'); loaderDiv.innerHTML = `<div class="loading-indicator"><svg class="infinity-loader" viewBox="0 0 100 40"><path d="M20,20 Q30,5 40,20 T60,20 T80,20" /></svg></div>`; chatDiv.appendChild(loaderDiv); chatContainer.scrollTop = chatContainer.scrollHeight; }
    function hideLoading() { const existingLoader = chatDiv.querySelector('.loading-indicator-wrapper'); if (existingLoader) { existingLoader.remove(); } }

    // --- Image Upload Function ---
    uploadBtn.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const messageDiv = document.createElement('div'); messageDiv.classList.add('message', 'user');
                const imageElement = document.createElement('img'); imageElement.src = e.target.result; imageElement.classList.add('message-image');
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const timestampSpan = document.createElement('span'); timestampSpan.classList.add('timestamp'); timestampSpan.textContent = timestamp;
                messageDiv.appendChild(imageElement); messageDiv.appendChild(timestampSpan); chatDiv.appendChild(messageDiv); chatContainer.scrollTop = chatContainer.scrollHeight;
                showLoading();
                setTimeout(() => { hideLoading(); const response = isEducationalMode ? "I've analyzed the image. The composition and lighting suggest a focus on..." : "Wow, that's a beautiful image! The colors and mood are really captivating."; addMessage(response, "note"); }, 2000 + Math.random() * 1500);
            };
            reader.readAsDataURL(file);
        }
        fileInput.value = '';
    });

    // --- Scroll to Bottom Button Logic ---
    chatContainer.addEventListener('scroll', () => {
        if (chatContainer.scrollTop < chatContainer.scrollHeight - chatContainer.clientHeight - 100) { scrollToBottomBtn.classList.remove('hidden'); } else { scrollToBottomBtn.classList.add('hidden'); }
    });
    scrollToBottomBtn.addEventListener('click', () => { chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); });

    // --- Mode Toggle Logic ---
    modeToggleBtn.addEventListener('click', () => {
        isEducationalMode = !isEducationalMode;
        const icon = modeToggleBtn.querySelector('i');
        if (isEducationalMode) { icon.className = 'fas fa-brain'; modeToggleBtn.title = 'Switch to Casual Mode'; } else { icon.className = 'fas fa-comments'; modeToggleBtn.title = 'Switch to Educational Mode'; }
    });

    // --- Message Sending Logic ---
    function addMessage(text, sender, isReply = false, originalMessageElement = null) {
        const messageDiv = document.createElement('div'); messageDiv.classList.add('message', sender);
        if (isReply && originalMessageElement) {
            messageDiv.classList.add('reply');
            const originalBubble = originalMessageElement.querySelector('.message-bubble');
            const originalId = originalBubble.dataset.messageId || `msg-${messageIdCounter++}`;
            originalBubble.dataset.messageId = originalId;
            const quoteBlock = document.createElement('div');
            quoteBlock.classList.add('reply-quote-block');
            quoteBlock.dataset.originalId = originalId;
            const sender_name = originalMessageElement.classList.contains('note') ? 'NOTE' : 'You';
            quoteBlock.innerHTML = `<span class="reply-quote-sender">${sender_name}</span><span class="reply-quote-text">${replyingTo}</span>`;
            messageDiv.appendChild(quoteBlock);
        }
        const bubbleDiv = document.createElement('div'); bubbleDiv.classList.add('message-bubble'); bubbleDiv.dataset.messageId = `msg-${messageIdCounter++}`; bubbleDiv.textContent = text;
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timestampSpan = document.createElement('span'); timestampSpan.classList.add('timestamp'); timestampSpan.textContent = timestamp;
        messageDiv.appendChild(bubbleDiv); messageDiv.appendChild(timestampSpan);
        chatDiv.appendChild(messageDiv);
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
        return messageDiv; // Return the element for potential highlighting
    }

    // --- The Brain ---
    function generateResponse(userMessage) {
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
    }

    sendBtn.addEventListener("click", () => {
        const messageText = userInput.value.trim();
        if (messageText !== "") {
            const isReply = replyingTo !== null;
            addMessage(messageText, "user", isReply, originalMessageToReplyTo);
            userInput.value = '';
            hideReplyContext();
            showLoading();
            setTimeout(() => {
                hideLoading();
                const response = generateResponse(messageText);
                const messageElement = addMessage(response, "note");
                if (response.includes("is") || response.includes("are") || response.includes("because") || response.includes("formula") || response.includes("solve") || response.includes("explain")) {
                    messageElement.classList.add('assistant-highlight');
                }
            }, 1500 + Math.random() * 1500);
        }
    });

    userInput.addEventListener("keypress", (event) => { if (event.key === "Enter") { sendBtn.click(); } });
});

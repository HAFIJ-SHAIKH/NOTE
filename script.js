// Main application script

// Global variables for DOM elements
let chatContainer, chatDiv, userInput, sendBtn, uploadBtn, fileInput, scrollToBottomBtn;

// Initialize the application
document.addEventListener("DOMContentLoaded", function() {
  // Get DOM elements
  chatContainer = document.getElementById("chat-container");
  chatDiv = document.getElementById("chat");
  userInput = document.getElementById("userInput");
  sendBtn = document.getElementById("sendBtn");
  uploadBtn = document.getElementById("uploadBtn");
  fileInput = document.getElementById("fileInput");
  scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  
  // Initialize event listeners
  initializeEventListeners();
});

// Initialize all event listeners
function initializeEventListeners() {
  // Upload button click
  uploadBtn.addEventListener('click', handleUploadClick);
  
  // File input change
  fileInput.addEventListener('change', handleFileSelect);
  
  // Send button click
  sendBtn.addEventListener('click', handleSendMessage);
  
  // Enter key in input
  userInput.addEventListener('keypress', handleKeyPress);
  
  // Scroll to bottom button
  scrollToBottomBtn.addEventListener('click', handleScrollToBottom);
  
  // Chat container scroll (throttled for performance)
  const throttledScrollHandler = throttle(handleChatScroll, 100);
  chatContainer.addEventListener('scroll', throttledScrollHandler);
}

// Handle upload button click
function handleUploadClick() {
  fileInput.click();
}

// Handle file selection
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    // Display image
    const reader = new FileReader();
    reader.onload = async (e) => {
      displayUserImage(e.target.result, chatDiv, chatContainer);
      
      // Perform OCR
      showLoading(chatDiv, chatContainer);
      addMessage("Processing image and extracting text...", "note", chatDiv, chatContainer);
      
      const extractedText = await processImageWithOCR(file, (progress) => {
        console.log(`OCR Progress: ${progress}%`);
      });
      
      if (extractedText && extractedText.length > 0) {
        hideLoading(chatDiv);
        addMessage(`Extracted text: "${truncateText(extractedText, 100)}"`, "note", chatDiv, chatContainer);
        
        // Search all APIs with extracted text
        showLoading(chatDiv, chatContainer);
        const results = await searchAllAPIs(extractedText);
        hideLoading(chatDiv);
        
        // Display results
        displaySearchResults(results);
      } else {
        hideLoading(chatDiv);
        addMessage("Could not extract any text from the image. Please try with a clearer image.", "note", chatDiv, chatContainer);
      }
    };
    reader.readAsDataURL(file);
  }
  fileInput.value = '';
}

// Handle send message
async function handleSendMessage() {
  const messageText = userInput.value.trim();
  if (messageText !== "") {
    addMessage(messageText, "user", chatDiv, chatContainer);
    userInput.value = '';

    // Check if this is a request for information
    if (isInformationRequest(messageText)) {
      showLoading(chatDiv, chatContainer);
      const searchTerm = extractSearchTerm(messageText);
      
      try {
        // Search all APIs
        const results = await searchAllAPIs(searchTerm);
        hideLoading(chatDiv);
        
        // Display results
        displaySearchResults(results);
      } catch (error) {
        hideLoading(chatDiv);
        addMessage("Sorry, I encountered an error while searching for information. Please try again later.", "note", chatDiv, chatContainer);
        console.error('Search error:', error);
      }
    } else {
      // Regular chat response
      showLoading(chatDiv, chatContainer);
      setTimeout(() => {
        hideLoading(chatDiv);
        const response = "That's an interesting point! If you're looking for information, try asking questions like 'What is [topic]?' or 'Tell me about [topic]'. You can also upload an image with text to search for information.";
        addMessage(response, "note", chatDiv, chatContainer);
      }, 1500);
    }
  }
}

// Handle key press
function handleKeyPress(event) {
  if (event.key === "Enter") {
    handleSendMessage();
  }
}

// Handle scroll to bottom
function handleScrollToBottom() {
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

// Handle chat scroll
function handleChatScroll() {
  if (chatContainer.scrollTop < chatContainer.scrollHeight - chatContainer.clientHeight - 100) { 
    scrollToBottomBtn.classList.remove('hidden'); 
  } else { 
    scrollToBottomBtn.classList.add('hidden'); 
  }
}

// Display search results
function displaySearchResults(results) {
  let hasResults = false;
  
  if (results.wikipedia) {
    displayWikipediaResult(results.wikipedia, chatDiv, chatContainer);
    hasResults = true;
  }
  
  if (results.openLibrary) {
    displayOpenLibraryResults(results.openLibrary, chatDiv, chatContainer);
    hasResults = true;
  }
  
  if (results.nasa) {
    displayNASAResults(results.nasa, chatDiv, chatContainer);
    hasResults = true;
  }
  
  if (!hasResults) {
    addMessage("I couldn't find any information. Could you try a different search term?", "note", chatDiv, chatContainer);
  }
}

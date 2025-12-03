// Main application script

document.addEventListener("DOMContentLoaded", function() {
  // Get DOM elements
  const chatContainer = document.getElementById("chat-container");
  const chatDiv = document.getElementById("chat");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  
  // --- Image Upload Function ---
  uploadBtn.addEventListener('click', () => { 
    fileInput.click(); 
  });
  
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Display the image
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
          if (results.wikipedia) {
            displayWikipediaResult(results.wikipedia, chatDiv, chatContainer);
          }
          
          if (results.openLibrary) {
            displayOpenLibraryResults(results.openLibrary, chatDiv, chatContainer);
          }
          
          if (results.nasa) {
            displayNASAResults(results.nasa, chatDiv, chatContainer);
          }
          
          if (!results.wikipedia && !results.openLibrary && !results.nasa) {
            addMessage(`No results found for extracted text.`, "note", chatDiv, chatContainer);
          }
        } else {
          hideLoading(chatDiv);
          addMessage("Could not extract any text from the image. Please try with a clearer image.", "note", chatDiv, chatContainer);
        }
      };
      reader.readAsDataURL(file);
    }
    fileInput.value = '';
  });

  // --- Scroll to Bottom Button Logic ---
  chatContainer.addEventListener('scroll', () => {
    if (chatContainer.scrollTop < chatContainer.scrollHeight - chatContainer.clientHeight - 100) { 
      scrollToBottomBtn.classList.remove('hidden'); 
    } else { 
      scrollToBottomBtn.classList.add('hidden'); 
    }
  });
  
  scrollToBottomBtn.addEventListener('click', () => { 
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' }); 
  });

  // --- Message Sending Logic ---
  sendBtn.addEventListener("click", async () => {
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
          if (results.wikipedia) {
            displayWikipediaResult(results.wikipedia, chatDiv, chatContainer);
          }
          
          if (results.openLibrary) {
            displayOpenLibraryResults(results.openLibrary, chatDiv, chatContainer);
          }
          
          if (results.nasa) {
            displayNASAResults(results.nasa, chatDiv, chatContainer);
          }
          
          if (!results.wikipedia && !results.openLibrary && !results.nasa) {
            addMessage(`I couldn't find information about "${searchTerm}". Could you try a different search term?`, "note", chatDiv, chatContainer);
          }
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
  });

  userInput.addEventListener("keypress", (event) => { 
    if (event.key === "Enter") { 
      sendBtn.click(); 
    } 
  });
});

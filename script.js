document.addEventListener("DOMContentLoaded", function() {
  const chatContainer = document.getElementById("chat-container");
  const chatDiv = document.getElementById("chat");
  const userInput = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInput = document.getElementById("fileInput");
  const scrollToBottomBtn = document.getElementById("scrollToBottomBtn");
  
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
    if (existingLoader) { 
      existingLoader.remove(); 
    } 
  }

  // --- Wikipedia API Functions ---
  async function searchWikipedia(query) {
    try {
      // First, search for the article
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (!searchData.query.search.length) {
        return null;
      }
      
      // Get the first result's page ID
      const pageId = searchData.query.search[0].pageid;
      
      // Get the page content, including an image
      const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|pageimages&exintro&explaintext&piprop=original&format=json&origin=*`;
      const contentResponse = await fetch(contentUrl);
      const contentData = await contentResponse.json();
      
      const page = contentData.query.pages[pageId];
      
      return {
        title: page.title,
        summary: page.extract,
        image: page.original ? page.original.source : null,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        pageId: pageId
      };
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
      return null;
    }
  }
  
  function displayWikipediaResult(data) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'note');
    
    const wikiCard = document.createElement('div');
    wikiCard.classList.add('wikipedia-result');
    
    // Header
    const header = document.createElement('div');
    header.classList.add('wiki-header');
    header.innerHTML = `
      <i class="fas fa-book-open wiki-icon"></i>
      <span class="wiki-title">Wikipedia: ${data.title}</span>
    `;
    wikiCard.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.classList.add('wiki-content');
    
    if (data.image) {
      const image = document.createElement('img');
      image.src = data.image;
      image.classList.add('wiki-image');
      content.appendChild(image);
    }
    
    const summary = document.createElement('div');
    summary.classList.add('wiki-summary');
    summary.textContent = data.summary;
    content.appendChild(summary);
    
    wikiCard.appendChild(content);
    
    // Actions
    const actions = document.createElement('div');
    actions.classList.add('wiki-actions');
    
    const moreBtn = document.createElement('button');
    moreBtn.classList.add('wiki-btn');
    moreBtn.textContent = 'More Details';
    moreBtn.addEventListener('click', async () => {
      if (!details.classList.contains('active')) {
        if (!details.textContent) {
          // Fetch more detailed content
          showLoading();
          try {
            const detailedUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${data.pageId}&prop=extracts&explaintext&format=json&origin=*`;
            const detailedResponse = await fetch(detailedUrl);
            const detailedData = await detailedResponse.json();
            
            const pageContent = detailedData.query.pages[data.pageId];
            details.textContent = pageContent.extract.substring(0, 1000) + '...';
          } catch (error) {
            details.textContent = "Error fetching more details.";
            console.error('Error fetching detailed Wikipedia data:', error);
          } finally {
            hideLoading();
          }
        }
        details.classList.add('active');
        moreBtn.textContent = 'Less Details';
      } else {
        details.classList.remove('active');
        moreBtn.textContent = 'More Details';
      }
    });
    
    const linkBtn = document.createElement('button');
    linkBtn.classList.add('wiki-btn');
    linkBtn.textContent = 'Open in Wikipedia';
    linkBtn.addEventListener('click', () => {
      window.open(data.url, '_blank');
    });
    
    actions.appendChild(moreBtn);
    actions.appendChild(linkBtn);
    wikiCard.appendChild(actions);
    
    // Details section (initially hidden)
    const details = document.createElement('div');
    details.classList.add('wiki-details');
    wikiCard.appendChild(details);
    
    messageDiv.appendChild(wikiCard);
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestampSpan = document.createElement('span'); 
    timestampSpan.classList.add('timestamp'); 
    timestampSpan.textContent = timestamp;
    messageDiv.appendChild(timestampSpan);
    
    chatDiv.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // --- OCR Function ---
  async function performOCR(imageFile) {
    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: m => console.log(m)
        }
      );
      return result.data.text.trim();
    } catch (error) {
      console.error('OCR Error:', error);
      return null;
    }
  }

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
        const messageDiv = document.createElement('div'); 
        messageDiv.classList.add('message', 'user');
        const imageElement = document.createElement('img'); 
        imageElement.src = e.target.result; 
        imageElement.classList.add('message-image');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timestampSpan = document.createElement('span'); 
        timestampSpan.classList.add('timestamp'); 
        timestampSpan.textContent = timestamp;
        messageDiv.appendChild(imageElement); 
        messageDiv.appendChild(timestampSpan); 
        chatDiv.appendChild(messageDiv); 
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Perform OCR
        showLoading();
        const extractedText = await performOCR(file);
        
        if (extractedText && extractedText.length > 0) {
          hideLoading();
          addMessage(`Extracted text: "${extractedText.substring(0, 100)}${extractedText.length > 100 ? '...' : ''}"`, "note");
          
          // Search Wikipedia with extracted text
          showLoading();
          const wikiData = await searchWikipedia(extractedText);
          hideLoading();
          
          if (wikiData) {
            displayWikipediaResult(wikiData);
          } else {
            addMessage(`No Wikipedia results found for the extracted text.`, "note");
          }
        } else {
          hideLoading();
          addMessage("Could not extract any text from the image. Please try with a clearer image.", "note");
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
  
  // Check if message is asking for information
  function isInformationRequest(message) {
    const infoKeywords = [
      'what is', 'who is', 'where is', 'when did', 'why did', 'how does', 
      'tell me about', 'explain', 'define', 'information about', 'details about',
      'history of', 'meaning of', 'describe', 'search for', 'find information'
    ];
    
    const lowerMessage = message.toLowerCase();
    return infoKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  // Extract search term from message
  function extractSearchTerm(message) {
    // Remove common question patterns
    let searchTerm = message.toLowerCase();
    
    // Remove question words
    searchTerm = searchTerm.replace(/^(what is|who is|where is|when did|why did|how does|tell me about|explain|define|information about|details about|history of|meaning of|describe|search for|find information)\s+/i, '');
    
    // Remove question marks and other punctuation
    searchTerm = searchTerm.replace(/[?.!;:,]+$/, '');
    
    return searchTerm.trim();
  }
  
  sendBtn.addEventListener("click", async () => {
    const messageText = userInput.value.trim();
    if (messageText !== "") {
      addMessage(messageText, "user");
      userInput.value = '';

      // Check if this is a request for information
      if (isInformationRequest(messageText)) {
        showLoading();
        const searchTerm = extractSearchTerm(messageText);
        
        try {
          const wikiData = await searchWikipedia(searchTerm);
          hideLoading();
          
          if (wikiData) {
            displayWikipediaResult(wikiData);
          } else {
            addMessage(`I couldn't find information about "${searchTerm}" on Wikipedia. Could you try a different search term?`, "note");
          }
        } catch (error) {
          hideLoading();
          addMessage("Sorry, I encountered an error while searching for information. Please try again later.", "note");
          console.error('Wikipedia search error:', error);
        }
      } else {
        // Regular chat response
        showLoading();
        setTimeout(() => {
          hideLoading();
          const response = "That's an interesting point! If you're looking for information, try asking questions like 'What is [topic]?' or 'Tell me about [topic]'.";
          addMessage(response, "note");
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

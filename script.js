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
      
      // Get detailed content for "show more" functionality
      const detailedUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|sections&explaintext&format=json&origin=*`;
      const detailedResponse = await fetch(detailedUrl);
      const detailedData = await detailedResponse.json();
      
      const detailedPage = detailedData.query.pages[pageId];
      
      return {
        title: page.title,
        summary: page.extract,
        image: page.original ? page.original.source : null,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        pageId: pageId,
        detailedContent: detailedPage.extract,
        sections: detailedPage.sections || []
      };
    } catch (error) {
      console.error('Error fetching Wikipedia data:', error);
      return null;
    }
  }
  
  // --- Open Library API Functions ---
  async function searchOpenLibrary(query) {
    try {
      const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3`;
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (!data.docs || data.docs.length === 0) {
        return null;
      }
      
      const results = data.docs.map(doc => {
        const coverId = doc.cover_i;
        const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
        
        return {
          title: doc.title,
          author: doc.author_name ? doc.author_name.join(', ') : 'Unknown Author',
          year: doc.first_publish_year || 'Unknown',
          cover: coverUrl,
          key: doc.key,
          description: doc.first_sentence ? doc.first_sentence[0] : 'No description available.',
          subjects: doc.subject ? doc.subject.slice(0, 5) : []
        };
      });
      
      return results;
    } catch (error) {
      console.error('Error fetching Open Library data:', error);
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
    moreBtn.textContent = 'Show More';
    moreBtn.addEventListener('click', () => {
      if (!details.classList.contains('active')) {
        details.classList.add('active');
        moreBtn.textContent = 'Show Less';
        
        // If details content is not yet populated, create it
        if (details.children.length === 0) {
          // Create bullet points from the detailed content
          const sections = data.sections.filter(section => section.line !== 'References' && section.line !== 'See also');
          
          if (sections.length > 0) {
            const pointsList = document.createElement('ul');
            pointsList.style.paddingLeft = '20px';
            pointsList.style.marginTop = '10px';
            
            sections.forEach(section => {
              const point = document.createElement('li');
              point.style.marginBottom = '8px';
              point.textContent = section.line;
              pointsList.appendChild(point);
            });
            
            details.appendChild(pointsList);
          } else {
            // If no sections, just add the detailed content
            const detailsText = document.createElement('div');
            detailsText.textContent = data.detailedContent.substring(0, 1000) + '...';
            details.appendChild(detailsText);
          }
        }
      } else {
        details.classList.remove('active');
        moreBtn.textContent = 'Show More';
      }
    });
    
    actions.appendChild(moreBtn);
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
  
  function displayOpenLibraryResults(books) {
    if (!books || books.length === 0) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'note');
    
    const libraryCard = document.createElement('div');
    libraryCard.classList.add('wikipedia-result');
    
    // Header
    const header = document.createElement('div');
    header.classList.add('wiki-header');
    header.innerHTML = `
      <i class="fas fa-book wiki-icon"></i>
      <span class="wiki-title">Open Library Results</span>
    `;
    libraryCard.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.classList.add('wiki-content');
    content.style.flexDirection = 'column';
    
    books.forEach((book, index) => {
      const bookItem = document.createElement('div');
      bookItem.style.display = 'flex';
      bookItem.style.marginBottom = '15px';
      bookItem.style.paddingBottom = '15px';
      bookItem.style.borderBottom = index < books.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none';
      
      if (book.cover) {
        const bookCover = document.createElement('img');
        bookCover.src = book.cover;
        bookCover.style.width = '80px';
        bookCover.style.height = '120px';
        bookCover.style.objectFit = 'cover';
        bookCover.style.borderRadius = '5px';
        bookCover.style.marginRight = '15px';
        bookItem.appendChild(bookCover);
      }
      
      const bookInfo = document.createElement('div');
      bookInfo.style.flex = '1';
      
      const bookTitle = document.createElement('div');
      bookTitle.style.fontWeight = '600';
      bookTitle.style.marginBottom = '5px';
      bookTitle.textContent = book.title;
      bookInfo.appendChild(bookTitle);
      
      const bookAuthor = document.createElement('div');
      bookAuthor.style.fontSize = '0.9rem';
      bookAuthor.style.color = 'var(--text-secondary)';
      bookAuthor.style.marginBottom = '5px';
      bookAuthor.textContent = `By: ${book.author} (${book.year})`;
      bookInfo.appendChild(bookAuthor);
      
      const bookDesc = document.createElement('div');
      bookDesc.style.fontSize = '0.85rem';
      bookDesc.style.marginBottom = '5px';
      bookDesc.textContent = book.description;
      bookInfo.appendChild(bookDesc);
      
      const moreBtn = document.createElement('button');
      moreBtn.classList.add('wiki-btn');
      moreBtn.style.fontSize = '0.75rem';
      moreBtn.style.padding = '3px 8px';
      moreBtn.textContent = 'More Details';
      moreBtn.addEventListener('click', () => {
        window.open(`https://openlibrary.org${book.key}`, '_blank');
      });
      bookInfo.appendChild(moreBtn);
      
      bookItem.appendChild(bookInfo);
      content.appendChild(bookItem);
    });
    
    libraryCard.appendChild(content);
    messageDiv.appendChild(libraryCard);
    
    // Add timestamp
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestampSpan = document.createElement('span'); 
    timestampSpan.classList.add('timestamp'); 
    timestampSpan.textContent = timestamp;
    messageDiv.appendChild(timestampSpan);
    
    chatDiv.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // --- Enhanced OCR Function ---
  async function performOCR(imageFile) {
    try {
      // Create a canvas to preprocess the image
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match the image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image on the canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data for preprocessing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply grayscale and contrast enhancement
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const contrast = 1.5;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        const adjusted = factor * (gray - 128) + 128;
        
        data[i] = adjusted;     // Red
        data[i + 1] = adjusted; // Green
        data[i + 2] = adjusted; // Blue
        // Alpha channel (data[i + 3]) remains unchanged
      }
      
      // Put the processed image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob for OCR
      canvas.toBlob(async (blob) => {
        // Use Tesseract with enhanced configuration
        const result = await Tesseract.recognize(
          blob,
          'eng',
          {
            logger: m => console.log(m),
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?;:()[]{}\'"-@#$%^&*+=<>/\\|`~ '
          }
        );
        
        return result.data.text.trim();
      }, 'image/jpeg', 0.95);
      
      // Fallback to direct file processing if canvas processing fails
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: m => console.log(m),
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?;:()[]{}\'"-@#$%^&*+=<>/\\|`~ '
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
        addMessage("Processing image and extracting text...", "note");
        
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
            
            // Also search Open Library
            showLoading();
            const libraryData = await searchOpenLibrary(extractedText);
            hideLoading();
            
            if (libraryData) {
              displayOpenLibraryResults(libraryData);
            }
          } else {
            // Try searching Open Library if Wikipedia fails
            showLoading();
            const libraryData = await searchOpenLibrary(extractedText);
            hideLoading();
            
            if (libraryData) {
              displayOpenLibraryResults(libraryData);
            } else {
              addMessage(`No results found for the extracted text.`, "note");
            }
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
      'history of', 'meaning of', 'describe', 'search for', 'find information',
      'book about', 'books on', 'read about', 'learn about', 'find book'
    ];
    
    const lowerMessage = message.toLowerCase();
    return infoKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  // Check if message is asking for book information
  function isBookRequest(message) {
    const bookKeywords = [
      'book about', 'books on', 'read about', 'find book', 'recommend book',
      'author', 'novel', 'publication', 'literature', 'reading'
    ];
    
    const lowerMessage = message.toLowerCase();
    return bookKeywords.some(keyword => lowerMessage.includes(keyword));
  }
  
  // Extract search term from message
  function extractSearchTerm(message) {
    // Remove common question patterns
    let searchTerm = message.toLowerCase();
    
    // Remove question words
    searchTerm = searchTerm.replace(/^(what is|who is|where is|when did|why did|how does|tell me about|explain|define|information about|details about|history of|meaning of|describe|search for|find information|book about|books on|read about|learn about|find book|recommend book)\s+/i, '');
    
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
          // Search Wikipedia
          const wikiData = await searchWikipedia(searchTerm);
          
          // Search Open Library
          const libraryData = await searchOpenLibrary(searchTerm);
          
          hideLoading();
          
          if (wikiData) {
            displayWikipediaResult(wikiData);
          }
          
          if (libraryData) {
            displayOpenLibraryResults(libraryData);
          }
          
      if (!wikiData && !libraryData) {
            addMessage(`I couldn't find information about "${searchTerm}". Could you try a different search term?`, "note");
          }
        } catch (error) {
          hideLoading();
          addMessage("Sorry, I encountered an error while searching for information. Please try again later.", "note");
          console.error('Search error:', error);
        }
      } else {
        // Regular chat response
        showLoading();
        setTimeout(() => {
          hideLoading();
          const response = "That's an interesting point! If you're looking for information, try asking questions like 'What is [topic]?' or 'Tell me about [topic]'. You can also upload an image with text to search for information.";
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

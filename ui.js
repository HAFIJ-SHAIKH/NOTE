// UI-related functions

let messageIdCounter = 0;

// --- Loading Indicator Functions ---
function showLoading(chatDiv, chatContainer) { 
  hideLoading(chatDiv); 
  const loaderDiv = document.createElement('div'); 
  loaderDiv.classList.add('message', 'note', 'loading-indicator-wrapper'); 
  loaderDiv.innerHTML = `<div class="loading-indicator"><svg class="infinity-loader" viewBox="0 0 100 40"><path d="M20,20 Q30,5 40,20 T60,20 T80,20" /></svg></div>`; 
  chatDiv.appendChild(loaderDiv); 
  chatContainer.scrollTop = chatContainer.scrollHeight; 
}

function hideLoading(chatDiv) { 
  const existingLoader = chatDiv.querySelector('.loading-indicator-wrapper'); 
  if (existingLoader) { 
    existingLoader.remove(); 
  } 
}

// --- Message Functions ---
function addMessage(text, sender, chatDiv, chatContainer) {
  const messageDiv = document.createElement('div'); 
  messageDiv.classList.add('message', sender);
  
  const bubbleDiv = document.createElement('div'); 
  bubbleDiv.classList.add('message-bubble'); 
  bubbleDiv.dataset.messageId = `msg-${messageIdCounter++}`;
  bubbleDiv.textContent = text;
  
  const timestamp = getCurrentTimestamp();
  const timestampSpan = document.createElement('span'); 
  timestampSpan.classList.add('timestamp'); 
  timestampSpan.textContent = timestamp;

  messageDiv.appendChild(bubbleDiv); 
  messageDiv.appendChild(timestampSpan); 
  
  chatDiv.appendChild(messageDiv);
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
  
  return messageDiv;
}

// --- Display Functions ---
function displayWikipediaResult(data, chatDiv, chatContainer) {
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
  moreBtn.addEventListener('click', async () => {
    if (!details.classList.contains('active')) {
      details.classList.add('active');
      moreBtn.textContent = 'Show Less';
      
      // If details content is not yet populated, fetch and create it
      if (details.children.length === 0) {
        showLoading(chatDiv, chatContainer);
        const sections = await getWikipediaDetails(data.pageId);
        hideLoading(chatDiv);
        
        if (sections && sections.length > 0) {
          const pointsList = document.createElement('ul');
          pointsList.style.paddingLeft = '20px';
          pointsList.style.marginTop = '10px';
          
          sections.forEach(section => {
            const point = document.createElement('li');
            point.style.marginBottom = '8px';
            
            // Create a title for the section
            const title = document.createElement('strong');
            title.textContent = section.title + ': ';
            point.appendChild(title);
            
            // Add the content
            const content = document.createElement('span');
            content.textContent = section.content.slice(0, 2).join(' ');
            if (section.content.length > 2) {
              content.textContent += '...';
            }
            point.appendChild(content);
            
            pointsList.appendChild(point);
          });
          
          details.appendChild(pointsList);
        } else {
          // Fallback if no sections
          const detailsText = document.createElement('div');
          detailsText.textContent = 'No additional details available.';
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
  const timestamp = getCurrentTimestamp();
  const timestampSpan = document.createElement('span'); 
  timestampSpan.classList.add('timestamp'); 
  timestampSpan.textContent = timestamp;
  messageDiv.appendChild(timestampSpan);
  
  chatDiv.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayOpenLibraryResults(books, chatDiv, chatContainer) {
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
    
    const bookEditions = document.createElement('div');
    bookEditions.style.fontSize = '0.8rem';
    bookEditions.style.color = 'var(--text-muted)';
    bookEditions.style.marginBottom = '5px';
    bookEditions.textContent = `Editions: ${book.editions}`;
    bookInfo.appendChild(bookEditions);
    
    if (book.subjects && book.subjects.length > 0) {
      const subjectsLabel = document.createElement('div');
      subjectsLabel.style.fontSize = '0.8rem';
      subjectsLabel.style.color = 'var(--text-muted)';
      subjectsLabel.style.marginBottom = '3px';
      subjectsLabel.textContent = 'Subjects:';
      bookInfo.appendChild(subjectsLabel);
      
      const subjectsList = document.createElement('div');
      subjectsList.style.fontSize = '0.8rem';
      subjectsList.style.color = 'var(--text-secondary)';
      subjectsList.style.marginBottom = '5px';
      subjectsList.textContent = book.subjects.slice(0, 3).join(', ');
      bookInfo.appendChild(subjectsList);
    }
    
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
  const timestamp = getCurrentTimestamp();
  const timestampSpan = document.createElement('span'); 
  timestampSpan.classList.add('timestamp'); 
  timestampSpan.textContent = timestamp;
  messageDiv.appendChild(timestampSpan);
  
  chatDiv.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function displayNASAResults(results, chatDiv, chatContainer) {
  if (!results || results.length === 0) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', 'note');
  
  const nasaCard = document.createElement('div');
  nasaCard.classList.add('wikipedia-result');
  
  // Header
  const header = document.createElement('div');
  header.classList.add('wiki-header');
  header.innerHTML = `
    <i class="fas fa-rocket wiki-icon"></i>
    <span class="wiki-title">NASA Results</span>
  `;
  nasaCard.appendChild(header);
  
  // Content
  const content = document.createElement('div');
  content.classList.add('wiki-content');
  content.style.flexDirection = 'column';
  
  results.forEach((item, index) => {
    const nasaItem = document.createElement('div');
    nasaItem.style.display = 'flex';
    nasaItem.style.marginBottom = '15px';
    nasaItem.style.paddingBottom = '15px';
    nasaItem.style.borderBottom = index < results.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none';
    
    if (item.image) {
      const nasaImage = document.createElement('img');
      nasaImage.src = item.image;
      nasaImage.style.width = '120px';
      nasaImage.style.height = '120px';
      nasaImage.style.objectFit = 'cover';
      nasaImage.style.borderRadius = '5px';
      nasaImage.style.marginRight = '15px';
      nasaItem.appendChild(nasaImage);
    }
    
    const nasaInfo = document.createElement('div');
    nasaInfo.style.flex = '1';
    
    const nasaTitle = document.createElement('div');
    nasaTitle.style.fontWeight = '600';
    nasaTitle.style.marginBottom = '5px';
    nasaTitle.textContent = item.title;
    nasaInfo.appendChild(nasaTitle);
    
    const nasaDate = document.createElement('div');
    nasaDate.style.fontSize = '0.9rem';
    nasaDate.style.color = 'var(--text-secondary)';
    nasaDate.style.marginBottom = '5px';
    nasaDate.textContent = `Date: ${item.date}`;
    nasaInfo.appendChild(nasaDate);
    
    const nasaDesc = document.createElement('div');
    nasaDesc.style.fontSize = '0.85rem';
    nasaDesc.style.marginBottom = '5px';
    nasaDesc.textContent = item.description;
    nasaInfo.appendChild(nasaDesc);
    
    if (item.nasaId) {
      const viewBtn = document.createElement('button');
      viewBtn.classList.add('wiki-btn');
      viewBtn.style.fontSize = '0.75rem';
      viewBtn.style.padding = '3px 8px';
      viewBtn.textContent = 'View Full Image';
      viewBtn.addEventListener('click', () => {
        window.open(`https://images-api.nasa.gov/asset/${item.nasaId}`, '_blank');
      });
      nasaInfo.appendChild(viewBtn);
    }
    
    nasaItem.appendChild(nasaInfo);
    content.appendChild(nasaItem);
  });
  
  nasaCard.appendChild(content);
  messageDiv.appendChild(nasaCard);
  
  // Add timestamp
  const timestamp = getCurrentTimestamp();
  const timestampSpan = document.createElement('span'); 
  timestampSpan.classList.add('timestamp'); 
  timestampSpan.textContent = timestamp;
  messageDiv.appendChild(timestampSpan);
  
  chatDiv.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// --- Image Display Function ---
function displayUserImage(imageSrc, chatDiv, chatContainer) {
  const messageDiv = document.createElement('div'); 
  messageDiv.classList.add('message', 'user');
  const imageElement = document.createElement('img'); 
  imageElement.src = imageSrc; 
  imageElement.classList.add('message-image');
  const timestamp = getCurrentTimestamp();
  const timestampSpan = document.createElement('span'); 
  timestampSpan.classList.add('timestamp'); 
  timestampSpan.textContent = timestamp;
  messageDiv.appendChild(imageElement); 
  messageDiv.appendChild(timestampSpan); 
  chatDiv.appendChild(messageDiv); 
  chatContainer.scrollTop = chatContainer.scrollHeight;
            }

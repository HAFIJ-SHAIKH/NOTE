// Utility functions for the application

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

// Check if message is asking for space/astronomy information
function isSpaceRequest(message) {
  const spaceKeywords = [
    'space', 'astronomy', 'planet', 'galaxy', 'star', 'universe', 'nasa',
    'astronaut', 'rocket', 'moon', 'mars', 'solar system', 'cosmos'
  ];
  
  const lowerMessage = message.toLowerCase();
  return spaceKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Get current timestamp
function getCurrentTimestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if a string is empty or only whitespace
function isEmpty(str) {
  return !str || str.trim().length === 0;
}

// Truncate text to a specified length
function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Create a safe HTML element
function safeCreateElement(tag, attributes = {}, textContent = '') {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  
  // Set text content safely
  if (textContent) {
    element.textContent = textContent;
  }
  
  return element;
}

// Add error handling wrapper
async function safeAPICall(apiFunction, errorMessage = 'API call failed') {
  try {
    return await apiFunction();
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
}

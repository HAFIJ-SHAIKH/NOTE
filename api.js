// API functions for Wikipedia, Open Library, and NASA

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
    
    // Get the page summary and image
    const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|pageimages&exintro&explaintext&piprop=original&format=json&origin=*`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    const page = summaryData.query.pages[pageId];
    
    return {
      title: page.title,
      summary: page.extract,
      image: page.original ? page.original.source : null,
      pageId: pageId
    };
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error);
    return null;
  }
}

// Function to get detailed Wikipedia content
async function getWikipediaDetails(pageId) {
  try {
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&explaintext&format=json&origin=*`;
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    const page = detailsData.query.pages[pageId];
    const fullText = page.extract;
    
    // Split the content into sections
    const sections = [];
    const lines = fullText.split('\n');
    let currentSection = null;
    
    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue;
      
      // Check if it's a heading
      if (line.length < 100 && line === line.toUpperCase() && !line.includes('.')) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line,
          content: []
        };
      } else if (currentSection) {
        // Add content to current section
        currentSection.content.push(line);
      } else {
        // Create a default section if none exists
        currentSection = {
          title: "Overview",
          content: [line]
        };
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  } catch (error) {
    console.error('Error fetching Wikipedia details:', error);
    return null;
  }
}

// --- Open Library API Functions ---
async function searchOpenLibrary(query) {
  try {
    const searchUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=3&fields=key,title,author_name,first_publish_year,cover_i,first_sentence,subject,edition_count`;
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
        subjects: doc.subject ? doc.subject.slice(0, 5) : [],
        editions: doc.edition_count || 0
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error fetching Open Library data:', error);
    return null;
  }
}

// --- NASA API Functions ---
async function searchNASA(query) {
  try {
    // Search NASA Image and Video Library
    const searchUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query)}&media_type=image`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (!data.collection.items || data.collection.items.length === 0) {
      return null;
    }
    
    const results = data.collection.items.slice(0, 3).map(item => {
      // Get the image URL
      let imageUrl = null;
      if (item.links && item.links.length > 0) {
        const imageLink = item.links.find(link => link.render === 'image');
        if (imageLink) {
          imageUrl = imageLink.href;
        }
      }
      
      // Get the description
      let description = 'No description available.';
      if (item.data && item.data.length > 0) {
        description = item.data[0].description || description;
        // Truncate if too long
        if (description.length > 200) {
          description = description.substring(0, 200) + '...';
        }
      }
      
      // Get title and date
      let title = 'Untitled';
      let date = 'Unknown';
      if (item.data && item.data.length > 0) {
        title = item.data[0].title || title;
        date = item.data[0].date_created || date;
      }
      
      return {
        title: title,
        description: description,
        image: imageUrl,
        date: date,
        nasaId: item.data[0].nasa_id || null
      };
    });
    
    return results;
  } catch (error) {
    console.error('Error fetching NASA data:', error);
    return null;
  }
}

// Combined search function
async function searchAllAPIs(query) {
  const results = {
    wikipedia: null,
    openLibrary: null,
    nasa: null
  };
  
  // Search all APIs in parallel
  const [wikiData, libraryData, nasaData] = await Promise.allSettled([
    searchWikipedia(query),
    searchOpenLibrary(query),
    searchNASA(query)
  ]);
  
  if (wikiData.status === 'fulfilled') {
    results.wikipedia = wikiData.value;
  }
  
  if (libraryData.status === 'fulfilled') {
    results.openLibrary = libraryData.value;
  }
  
  if (nasaData.status === 'fulfilled') {
    results.nasa = nasaData.value;
  }
  
  return results;
}

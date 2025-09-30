(() => {
  // Twitter-specific selectors for extracting tweet text
  const twitterSelectors = [
      
      '[data-testid="tweetText"]',
      
      'div[data-testid="tweetText"] span.css-1jxf684',
      
      'span.css-1jxf684',
     
      '[data-testid="tweet"] div[lang]',
      
      'div[data-testid="tweet"] > div > div > div > div[dir="auto"] span',
      // Legacy selectors
      '.tweet-text',
      '.js-tweet-text'
  ];
  
  // General headline selectors for non-Twitter sites
  const generalSelectors = [
      'h1',
      '[class*="headline"]',
      '[class*="title"]',
      '[class*="Heading"]',
      '[class*="head"]',
      '[itemprop="headline"]',
      'meta[property="og:title"]',
      'meta[name="title"]',
      'title'
  ];
  
  let headline = null;
  let tweetAuthor = null;
  let tweetTime = null;
  let tweetUrl = null;
  
  // Check if we're on Twitter
  const isTwitter = window.location.hostname.includes('twitter.com');
  
  // Function to extract tweet metadata
  function extractTweetMetadata() {
      if (!isTwitter) return;
      
      // Extract tweet author
      const authorSelectors = [
          '[data-testid="User-Name"] a div span',
          '[data-testid="User-Name"] span',
          'div[data-testid="User-Name"] span'
      ];
      
      for (const selector of authorSelectors) {
          const authorElement = document.querySelector(selector);
          if (authorElement && authorElement.textContent.trim()) {
              tweetAuthor = authorElement.textContent.trim();
              break;
          }
      }
      
      // Extract tweet time
      const timeElement = document.querySelector('time');
      if (timeElement) {
          tweetTime = timeElement.getAttribute('datetime');
      }
      
      // Extract tweet URL
      const urlElement = document.querySelector('link[rel="canonical"]');
      if (urlElement) {
          tweetUrl = urlElement.getAttribute('href');
      }
  }
  
  // Function to extract text from nested elements
  function extractTextFromElement(element) {
      // For Twitter tweets, we need to handle nested spans
      if (isTwitter && element.querySelectorAll('span').length > 0) {
          const spans = element.querySelectorAll('span');
          let text = '';
          spans.forEach(span => {
              // Check if span has text content and isn't just a container
              if (span.textContent.trim() && span.textContent.trim() !== '') {
                  // Skip common UI elements that aren't part of the tweet
                  if (!span.closest('button') && 
                      !span.closest('[role="button"]') && 
                      !span.closest('[data-testid="reply"]') &&
                      !span.closest('[data-testid="retweet"]') &&
                      !span.closest('[data-testid="like"]') &&
                      !span.closest('[data-testid="follow"]')) {
                      text += span.textContent.trim() + ' ';
                  }
              }
          });
          return text.trim();
      }
      
      // For other elements
      return element.innerText || element.textContent || '';
  }
  
  // Function to extract tweet text specifically
  function extractTweetText() {
      // First, try to find the specific span class mentioned directly
      const specificSpan = document.querySelector('span.css-1jxf684');
      if (specificSpan) {
          console.log("Found specific span with css-1jxf684 class:", specificSpan);
          const text = specificSpan.textContent.trim();
          console.log("Text from specific span:", text);
          
          if (text.length >= 10) {
              return text;
          }
      }
      
      // Find the main tweet container
      const tweetContainer = document.querySelector('[data-testid="tweet"]');
      
      if (tweetContainer) {
          console.log("Found tweet container:", tweetContainer);
          
          // First, try to find the specific tweet text element with data-testid
          const tweetTextElement = tweetContainer.querySelector('[data-testid="tweetText"]');
          if (tweetTextElement) {
              console.log("Found tweetText element:", tweetTextElement);
              // Extract text from all spans within this element
              const text = extractTextFromElement(tweetTextElement).trim();
              console.log("Extracted text from tweetText:", text);
              
              // Skip if text is too short or contains only URLs/hashtags
              if (text.length >= 10 && !text.match(/^https?:\/\//) && !text.match(/^#\w+$/)) {
                  // Skip common UI text that's not the actual tweet
                  if (!text.match(/^(conversation|see new tweets|show this thread)$/i)) {
                      return text;
                  }
              }
          }
          
          // Try to find the specific class mentioned within the tweet container
          const specificSpanInContainer = tweetContainer.querySelector('span.css-1jxf684');
          if (specificSpanInContainer) {
              console.log("Found specific span with css-1jxf684 class in container:", specificSpanInContainer);
              const text = specificSpanInContainer.textContent.trim();
              console.log("Text from specific span in container:", text);
              
              if (text.length >= 10) {
                  return text;
              }
          }
          
          // If that didn't work, try each selector within the tweet container
          for (const selector of twitterSelectors) {
              console.log("Trying selector:", selector);
              const elements = tweetContainer.querySelectorAll(selector);
              console.log("Found elements with selector:", elements.length);
              
              for (const element of elements) {
                  // Skip if element is not visible
                  if (element.offsetParent === null) continue;
                  
                  // Skip if element is inside a button or interactive element
                  if (element.closest('button') || 
                      element.closest('[role="button"]') || 
                      element.closest('[data-testid="reply"]') ||
                      element.closest('[data-testid="retweet"]') ||
                      element.closest('[data-testid="like"]') ||
                      element.closest('[data-testid="follow"]')) continue;
                  
                  // Get text content
                  const text = extractTextFromElement(element).trim();
                  console.log("Text from element:", text);
                  
                  // Skip if text is too short or contains only URLs/hashtags
                  if (text.length < 10) continue;
                  if (text.match(/^https?:\/\//)) continue;
                  if (text.match(/^#\w+$/)) continue;
                  
                  // Skip common UI text that's not the actual tweet
                  if (text.match(/^(conversation|see new tweets|show this thread)$/i)) continue;
                  
                  return text;
              }
          }
      } else {
          console.log("Tweet container not found");
      }
      
      // Fallback: try to find tweet text anywhere on the page
      console.log("Trying fallback: find tweet text anywhere on the page");
      for (const selector of twitterSelectors) {
          console.log("Trying selector (fallback):", selector);
          const elements = document.querySelectorAll(selector);
          console.log("Found elements with selector (fallback):", elements.length);
          
          for (const element of elements) {
              // Skip if element is not visible
              if (element.offsetParent === null) continue;
              
              // Skip if element is inside a button or interactive element
              if (element.closest('button') || 
                  element.closest('[role="button"]') || 
                  element.closest('[data-testid="reply"]') ||
                  element.closest('[data-testid="retweet"]') ||
                  element.closest('[data-testid="like"]') ||
                  element.closest('[data-testid="follow"]')) continue;
              
              // Get text content
              const text = extractTextFromElement(element).trim();
              console.log("Text from element (fallback):", text);
              
              // Skip if text is too short or contains only URLs/hashtags
              if (text.length < 10) continue;
              if (text.match(/^https?:\/\//)) continue;
              if (text.match(/^#\w+$/)) continue;
              
              // Skip common UI text that's not the actual tweet
              if (text.match(/^(conversation|see new tweets|show this thread)$/i)) continue;
              
              return text;
          }
      }
      
      return null;
  }
  
  // Function to extract general headline
  function extractGeneralHeadline() {
      for (const selector of generalSelectors) {
          const elements = document.querySelectorAll(selector);
          
          for (const element of elements) {
              // Skip if element is not visible
              if (element.offsetParent === null) continue;
              
              // Special case for meta tags
              if (element.tagName.toLowerCase() === 'meta') {
                  const content = element.content;
                  if (content && content.length > 10) {
                      return content;
                  }
                  continue;
              }
              
              // Get text content
              const text = extractTextFromElement(element).trim();
              
              // Skip if text is too short or contains only URLs/hashtags
              if (text.length < 10) continue;
              if (text.match(/^https?:\/\//)) continue;
              if (text.match(/^#\w+$/)) continue;
              
              return text;
          }
      }
      
      return null;
  }
  
  // Extract the headline based on the site type
  if (isTwitter) {
      console.log("Detected Twitter page, extracting tweet text");
      headline = extractTweetText();
      if (headline) {
          extractTweetMetadata();
      }
  } else {
      console.log("Not a Twitter page, extracting general headline");
      headline = extractGeneralHeadline();
  }
  
  // Log for debugging
  console.log('Extracted headline:', headline);
  console.log('Tweet author:', tweetAuthor);
  console.log('Tweet time:', tweetTime);
  console.log('Tweet URL:', tweetUrl);
  console.log('Is Twitter:', isTwitter);
  
  // Send the result to popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getHeadline') {
          sendResponse({ 
              headline: headline || null,
              author: tweetAuthor,
              time: tweetTime,
              url: tweetUrl,
              isTwitter: isTwitter
          });
      }
  });
})();
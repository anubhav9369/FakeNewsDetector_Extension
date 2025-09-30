async function getHeadline() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript(
                {
                    target: { tabId: tabId },
                    func: () => {
                        // Twitter-specific selectors for extracting tweet text
                        const twitterSelectors = [
                            // Primary tweet text selector - most reliable
                            '[data-testid="tweetText"]',
                            // More specific selector for the actual tweet content
                            'div[data-testid="tweetText"] span.css-1jxf684',
                            // Direct selector for the specific span class mentioned
                            'span.css-1jxf684',
                            // Alternative selectors for different Twitter layouts
                            '[data-testid="tweet"] div[lang]',
                            // More specific selectors for nested elements
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
                        
                        return {
                            headline: headline || null,
                            author: tweetAuthor,
                            time: tweetTime,
                            url: tweetUrl,
                            isTwitter: isTwitter
                        };
                    },
                },
                (results) => {
                    if (chrome.runtime.lastError || !results || results.length === 0) {
                        console.error("Script injection failed or no result.");
                        resolve(null);
                    } else {
                        resolve(results[0].result || null);
                    }
                }
            );
        });
    });
  }
  
  async function fetchPrediction(headline) {
    // Log the headline being sent to the backend for debugging
    console.log('Sending to backend:', headline);
    
    const url = "http://localhost:5001/predict";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: headline })
        });
        if (!response.ok) {
            console.error("Non-200 response:", response.status);
            return { error: "Server error" };
        }
        const data = await response.json();
        console.log("Prediction response:", data);
        return data;
    } catch (err) {
        console.error("Prediction failed:", err);
        return { error: "Error connecting to prediction service" };
    }
  }
  
  function updateUI(headlineData, predictionData) {
    const headlineElem = document.getElementById("headline");
    const resultElem = document.getElementById("result");
    const confidenceBar = document.getElementById("confidence-bar");
    const realPercent = document.getElementById("real-percent");
    const fakePercent = document.getElementById("fake-percent");
    const authorInfo = document.getElementById("author-info");
    
    if (headlineData && headlineData.headline) {
        // Display headline
        headlineElem.innerText = headlineData.headline;
        
        // Display author info if available (Twitter)
        if (headlineData.isTwitter && authorInfo) {
            let authorText = '';
            if (headlineData.author) {
                authorText += `By: ${headlineData.author}`;
            }
            if (headlineData.time) {
                const date = new Date(headlineData.time);
                authorText += ` • ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            }
            authorInfo.innerText = authorText;
            authorInfo.style.display = 'block';
        } else if (authorInfo) {
            authorInfo.style.display = 'none';
        }
        
        if (predictionData.error) {
            resultElem.innerText = predictionData.error;
            resultElem.className = "error";
            return;
        }
        
        const { prediction, confidence, real_probability, fake_probability, is_confident } = predictionData;
        
        // Set prediction text with confidence
        resultElem.innerHTML = `
            <div class="prediction-result ${prediction.toLowerCase()}">
                Prediction: <strong>${prediction}</strong>
                <span class="confidence">(${confidence.toFixed(1)}% confidence)</span>
            </div>
            ${!is_confident ? '<div class="warning">Low confidence prediction - verify with other sources</div>' : ''}
        `;
        
        // Update confidence bar
        if (confidenceBar) {
            confidenceBar.style.width = `${confidence}%`;
            confidenceBar.className = `confidence-bar ${prediction.toLowerCase()}`;
        }
        
        // Update percentage displays
        if (realPercent) realPercent.innerText = `${real_probability.toFixed(1)}%`;
        if (fakePercent) fakePercent.innerText = `${fake_probability.toFixed(1)}%`;
        
        // Set result element class based on prediction
        resultElem.className = prediction.toLowerCase();
    } else {
        headlineElem.innerText = "No headline found!";
        resultElem.innerText = "Failed to extract headline. Check console for details.";
        resultElem.className = "error";
        if (authorInfo) authorInfo.style.display = 'none';
    }
  }
  
  // Function to refresh the analysis
  function refreshAnalysis() {
      const headlineElem = document.getElementById("headline");
      const resultElem = document.getElementById("result");
      const confidenceBar = document.getElementById("confidence-bar");
      const realPercent = document.getElementById("real-percent");
      const fakePercent = document.getElementById("fake-percent");
      const authorInfo = document.getElementById("author-info");
      
      // Reset UI
      headlineElem.innerText = "Loading...";
      resultElem.innerText = "Checking...";
      resultElem.className = "";
      confidenceBar.style.width = "0%";
      confidenceBar.className = "confidence-bar";
      realPercent.innerText = "0%";
      fakePercent.innerText = "0%";
      authorInfo.style.display = "none";
      
      // Get headline and fetch prediction again
      getHeadline().then(headlineData => {
          if (headlineData && headlineData.headline) {
              fetchPrediction(headlineData.headline).then(predictionData => {
                  updateUI(headlineData, predictionData);
              });
          } else {
              headlineElem.innerText = "No headline found!";
              resultElem.innerText = "Failed to extract headline. Check console for details.";
              resultElem.className = "error";
          }
      });
  }
  
  // Initialize the popup
  (async () => {
    // Get headline and fetch prediction
    getHeadline().then(headlineData => {
        const headlineElem = document.getElementById("headline");
        const resultElem = document.getElementById("result");
        
        if (headlineData && headlineData.headline) {
            fetchPrediction(headlineData.headline).then(predictionData => {
                updateUI(headlineData, predictionData);
            });
        } else {
            headlineElem.innerText = "No headline found!";
            resultElem.innerText = "Failed to extract headline. Check console for details.";
            resultElem.className = "error";
        }
    });
    
    // Add event listener for refresh button
    document.addEventListener('DOMContentLoaded', () => {
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshAnalysis);
        }
    });
  })();
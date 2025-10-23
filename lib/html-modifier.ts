
/**
 * Automatically modifies uploaded Blender HTML to work with the app
 * - Adds message listener to receive file URLs from parent
 * - Replaces hardcoded file paths with received URLs
 * - Sends export data back to parent instead of downloading
 * - Handles import data from parent to restore previous exports
 */

export function modifyBlenderHTML(htmlContent: string, planId: string): string {
  // Add viewport meta tag for proper mobile responsiveness and landscape support
  const viewportMeta = `
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover">
  `;
  
  // Create CSS injection for proper sizing and scrolling when embedded
  const cssInjection = `
  <style>
    /* ===== SEAMLESS SMILE TRACKER IFRAME INTEGRATION ===== */
    /* Enable proper scrolling and responsive layout */
    
    /* HIDE THE BLENDER HTML'S OWN HEADER (with logo and link) */
    header,
    header > a,
    header > a > img {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-height: 100% !important;
      overflow-x: hidden !important;
      overflow-y: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    
    /* Ensure smooth scrolling on mobile */
    body {
      position: relative !important;
      scroll-behavior: smooth !important;
    }
    
    /* Ensure all fixed position elements become absolute to stay within iframe */
    [style*="position: fixed"],
    [style*="position:fixed"] {
      position: absolute !important;
    }
    
    /* Adjust canvas sizing */
    canvas {
      display: block !important;
      max-width: 100% !important;
    }
    
    /* Mobile responsive adjustments */
    @media (max-width: 768px) {
      html, body {
        font-size: 14px !important;
      }
      
      /* Adjust button sizes for mobile */
      button,
      .button,
      [role="button"] {
        font-size: 13px !important;
        padding: 8px 12px !important;
        min-width: auto !important;
        touch-action: manipulation !important;
      }
      
      /* Keep tables at readable size on mobile */
      table {
        font-size: 13px !important;
        display: block !important;
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch !important;
        max-height: 50vh !important;
        overflow-y: auto !important;
      }
      
      table th,
      table td {
        padding: 6px 8px !important;
        font-size: 13px !important;
        white-space: nowrap !important;
      }
      
      /* Input fields in tables */
      table input,
      table select {
        font-size: 13px !important;
        padding: 4px 6px !important;
        min-width: 60px !important;
      }
      
      /* Control panels at normal size */
      .edit-mode,
      .edit-controls,
      .movement-table,
      div[class*="control"],
      div[class*="panel"] {
        font-size: 13px !important;
        padding: 8px !important;
        max-width: 100% !important;
      }
      
      /* Make movement-controls smaller on mobile only */
      .movement-controls,
      #movement-controls,
      div[class*="movement-control"] {
        font-size: 11px !important;
        padding: 6px !important;
        max-width: 90% !important;
        transform: scale(0.85) !important;
        transform-origin: top left !important;
      }
      
      .movement-controls table,
      #movement-controls table,
      div[class*="movement-control"] table {
        font-size: 11px !important;
        max-height: 40vh !important;
      }
      
      .movement-controls table th,
      .movement-controls table td,
      #movement-controls table th,
      #movement-controls table td {
        padding: 4px 6px !important;
        font-size: 11px !important;
      }
      
      .movement-controls input,
      .movement-controls select,
      #movement-controls input,
      #movement-controls select {
        font-size: 10px !important;
        padding: 2px 4px !important;
        min-width: 50px !important;
      }
      
      .movement-controls button,
      #movement-controls button {
        font-size: 11px !important;
        padding: 6px 10px !important;
      }
      
      /* Normal heading sizes in control panels */
      .edit-mode h1,
      .edit-mode h2,
      .edit-mode h3,
      .edit-controls h1,
      .edit-controls h2,
      .edit-controls h3 {
        font-size: 16px !important;
        margin: 8px 0 !important;
      }
    }
    
    /* Landscape orientation support */
    @media (orientation: landscape) {
      html {
        height: 100% !important;
        width: 100% !important;
      }
      
      body {
        min-height: 100% !important;
        height: auto !important;
      }
      
      /* Minimal adjustments for landscape on small screens */
      @media (max-height: 600px) {
        /* Keep tables readable even in landscape */
        table {
          font-size: 12px !important;
          max-height: 45vh !important;
        }
        
        table th,
        table td {
          padding: 5px 7px !important;
          font-size: 12px !important;
        }
        
        table input,
        table select {
          font-size: 12px !important;
          padding: 3px 5px !important;
          min-width: 55px !important;
        }
      }
      
      /* Very small landscape screens - minimal reduction */
      @media (max-height: 450px) {
        table {
          max-height: 40vh !important;
          font-size: 11px !important;
        }
        
        table th,
        table td {
          padding: 4px 6px !important;
          font-size: 11px !important;
        }
      }
    }
    
    /* Ensure edit mode tables and controls are visible */
    .edit-mode,
    .edit-controls,
    .movement-table,
    table[class*="table"],
    div[class*="table"] {
      margin-bottom: 20px !important;
      padding-bottom: 20px !important;
    }
    
    /* Add bottom spacing to ensure all content is accessible */
    body::after {
      content: "";
      display: block;
      height: 50px;
      width: 100%;
    }
  </style>
  `;
  
  // Create the injection script that will be added to the HTML
  const injectionScript = `
  <script>
    // ===== SEAMLESS SMILE TRACKER AUTO-INTEGRATION =====
    // This script is automatically injected to make the Blender viewer work with our app
    
    (function() {
      console.log('[3D Viewer] Auto-integration script loaded');
      
      // Store the received URLs
      let fileUrls = {
        unitedModelUrl: null,
        separateModelUrl: null,
        pdfUrl: null
      };
      
      // Queue to store pending requests that are waiting for URLs
      let pendingRequests = [];
      let urlsReceived = false;
      
      // 1. Listen for messages from parent app
      window.addEventListener('message', function(event) {
        const data = event.data;
        
        // Handle file URLs
        if (data && (data.type === 'FILE_URLS' || data.type === 'ASSET_URLS')) {
          console.log('[3D Viewer] Received file URLs from parent:', data);
          
          // Support both formats
          if (data.payload) {
            fileUrls = data.payload;
          } else if (data.urls) {
            fileUrls = data.urls;
          }
          
          urlsReceived = true;
          console.log('[3D Viewer] Processed file URLs:', fileUrls);
          
          // Process any pending requests
          if (pendingRequests.length > 0) {
            console.log('[3D Viewer] Processing', pendingRequests.length, 'pending requests');
            pendingRequests.forEach(req => req.resolve());
            pendingRequests = [];
          }
          
          // Inject the URLs into the viewer
          if (window.injectFileUrls) {
            window.injectFileUrls(fileUrls);
          } else {
            // Store for later use
            window.__pendingFileUrls = fileUrls;
          }
        }
        
        // Handle import data
        if (data && data.type === 'IMPORT_DATA') {
          console.log('[3D Viewer] Received import data from parent');
          handleImportData(data.exportData);
        }
      });
      
      // Function to handle importing previous exports
      function handleImportData(exportData) {
        if (!exportData) {
          console.error('[3D Viewer] Invalid import data - no data provided');
          return;
        }
        
        console.log('[3D Viewer] Import data received:', {
          hasMovements: !!exportData.movements,
          movementCount: exportData.movements?.length || 0,
          keys: Object.keys(exportData)
        });
        
        // Store the data globally for debugging
        window.__importData = exportData;
        console.log('[3D Viewer] Import data stored in window.__importData for inspection');
        
        // Strategy 1: Try to find specific import functions in the viewer
        if (typeof window.importToothMovements === 'function') {
          console.log('[3D Viewer] Found importToothMovements function, calling it');
          window.importToothMovements(exportData.movements || exportData);
          notifyImportSuccess();
          return;
        }
        
        if (typeof window.applyMovements === 'function') {
          console.log('[3D Viewer] Found applyMovements function, calling it');
          window.applyMovements(exportData.movements || exportData);
          notifyImportSuccess();
          return;
        }
        
        if (typeof window.loadMovementData === 'function') {
          console.log('[3D Viewer] Found loadMovementData function, calling it');
          window.loadMovementData(exportData);
          notifyImportSuccess();
          return;
        }
        
        // Strategy 2: Try to find a file input element and simulate upload
        const fileInputs = document.querySelectorAll('input[type="file"]');
        if (fileInputs.length > 0) {
          console.log('[3D Viewer] Found', fileInputs.length, 'file input(s), attempting to simulate upload');
          
          // Create a JSON blob
          const jsonString = JSON.stringify(exportData, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const file = new File([blob], 'import.json', { type: 'application/json' });
          
          // Try to set the file on the input
          const fileInput = fileInputs[0];
          try {
            // Create a DataTransfer object
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            
            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(changeEvent);
            
            console.log('[3D Viewer] File input populated and change event triggered');
            notifyImportSuccess();
            return;
          } catch (error) {
            console.error('[3D Viewer] Error simulating file input:', error);
          }
        }
        
        // Strategy 3: Look for an import button to click
        const importButtons = Array.from(document.querySelectorAll('button, input[type="button"], a'))
          .filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            const id = el.id?.toLowerCase() || '';
            const className = el.className?.toLowerCase() || '';
            return text.includes('import') || id.includes('import') || className.includes('import') ||
                   text.includes('load') || id.includes('load') || className.includes('load');
          });
        
        if (importButtons.length > 0) {
          console.log('[3D Viewer] Found', importButtons.length, 'potential import button(s)');
          console.log('[3D Viewer] Import data is stored in window.__importData - you may need to manually import it');
          notifyImportManual();
          return;
        }
        
        // Strategy 4: No automatic import method found
        console.warn('[3D Viewer] No automatic import method found. Import data is stored in window.__importData');
        console.log('[3D Viewer] You can access the data via: console.log(window.__importData)');
        notifyImportManual();
      }
      
      function notifyImportSuccess() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'IMPORT_SUCCESS',
            message: 'Import completed successfully'
          }, '*');
        }
      }
      
      function notifyImportManual() {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'IMPORT_MANUAL',
            message: 'Viewer requires manual import. Data available in console as window.__importData'
          }, '*');
        }
      }
      
      // 2. Intercept file loading functions
      const originalFetch = window.fetch;
      window.fetch = async function(input, init) {
        let url = typeof input === 'string' ? input : input.url;
        
        // Check if this is a GLB model request
        if (url && (url.includes('.glb') || url.includes('.gltf'))) {
          console.log('[3D Viewer] Intercepting GLB request:', url);
          
          // If URLs haven't been received yet, wait for them
          if (!urlsReceived) {
            console.log('[3D Viewer] Waiting for file URLs...');
            await new Promise(resolve => {
              pendingRequests.push({ resolve });
            });
          }
          
          // Determine which model is being requested
          let replacementUrl = null;
          if (url.includes('united') || url.includes('United')) {
            replacementUrl = fileUrls.unitedModelUrl;
          } else if (url.includes('separate') || url.includes('Separate')) {
            replacementUrl = fileUrls.separateModelUrl;
          } else if (fileUrls.unitedModelUrl) {
            // Default to united model if we can't determine
            replacementUrl = fileUrls.unitedModelUrl;
          }
          
          if (replacementUrl) {
            console.log('[3D Viewer] Replacing with signed URL:', replacementUrl);
            return originalFetch(replacementUrl, init);
          } else {
            console.warn('[3D Viewer] No replacement URL found for:', url);
          }
        }
        
        // Check if this is a PDF request
        if (url && url.includes('.pdf')) {
          console.log('[3D Viewer] Intercepting PDF request:', url);
          
          // If URLs haven't been received yet, wait for them
          if (!urlsReceived) {
            console.log('[3D Viewer] Waiting for PDF URL...');
            await new Promise(resolve => {
              pendingRequests.push({ resolve });
            });
          }
          
          if (fileUrls.pdfUrl) {
            console.log('[3D Viewer] Replacing PDF with signed URL');
            return originalFetch(fileUrls.pdfUrl, init);
          }
        }
        
        return originalFetch(input, init);
      };
      
      // 2b. Intercept PDF loading in embed and object tags
      const originalSetAttribute = Element.prototype.setAttribute;
      Element.prototype.setAttribute = function(name, value) {
        // Intercept src and data attributes that load PDFs
        if ((name === 'src' || name === 'data') && value && typeof value === 'string' && value.includes('.pdf')) {
          console.log('[3D Viewer] Intercepting PDF embed/object:', this.tagName, name, value);
          
          // If we have the PDF URL, replace it immediately
          if (urlsReceived && fileUrls.pdfUrl) {
            console.log('[3D Viewer] Replacing with signed PDF URL');
            return originalSetAttribute.call(this, name, fileUrls.pdfUrl);
          } else if (!urlsReceived) {
            // If URLs haven't been received yet, store for later and set a temporary value
            console.log('[3D Viewer] Delaying PDF load - URLs not received yet');
            const element = this;
            const attrName = name;
            
            // Store the pending operation
            const pendingOp = {
              resolve: () => {
                if (fileUrls.pdfUrl) {
                  console.log('[3D Viewer] Now setting PDF URL after wait');
                  originalSetAttribute.call(element, attrName, fileUrls.pdfUrl);
                  
                  // Trigger reload if it's an embed or object
                  if (element.tagName === 'EMBED' || element.tagName === 'OBJECT') {
                    // Force reload by temporarily removing and re-adding
                    const parent = element.parentNode;
                    const next = element.nextSibling;
                    if (parent) {
                      parent.removeChild(element);
                      parent.insertBefore(element, next);
                    }
                  }
                }
              }
            };
            pendingRequests.push(pendingOp);
            
            // Set a temporary value to prevent immediate load
            return originalSetAttribute.call(this, name, 'about:blank');
          }
        }
        
        return originalSetAttribute.call(this, name, value);
      };
      
      // 2c. Intercept PDF.js document loading
      // PDF.js uses getDocument API which we need to intercept
      const interceptPDFJS = () => {
        // Wait for PDF.js to load
        const checkPDFJS = setInterval(() => {
          if (window.pdfjsLib && window.pdfjsLib.getDocument) {
            clearInterval(checkPDFJS);
            console.log('[3D Viewer] PDF.js detected, intercepting getDocument');
            
            const originalGetDocument = window.pdfjsLib.getDocument;
            window.pdfjsLib.getDocument = function(src) {
              // If src is a string (URL) and contains .pdf, replace it
              if (typeof src === 'string' && src.includes('.pdf')) {
                console.log('[3D Viewer] Intercepting PDF.js getDocument:', src);
                
                if (urlsReceived && fileUrls.pdfUrl) {
                  console.log('[3D Viewer] Replacing with signed PDF URL');
                  return originalGetDocument(fileUrls.pdfUrl);
                } else {
                  console.warn('[3D Viewer] PDF URLs not received yet, using original (may fail)');
                }
              }
              // If src is an object with url property
              else if (src && typeof src === 'object' && src.url && src.url.includes('.pdf')) {
                console.log('[3D Viewer] Intercepting PDF.js getDocument (object):', src.url);
                
                if (urlsReceived && fileUrls.pdfUrl) {
                  console.log('[3D Viewer] Replacing with signed PDF URL');
                  return originalGetDocument({ ...src, url: fileUrls.pdfUrl });
                } else {
                  console.warn('[3D Viewer] PDF URLs not received yet, using original (may fail)');
                }
              }
              
              return originalGetDocument(src);
            };
          }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkPDFJS), 10000);
      };
      
      // Start intercepting PDF.js
      interceptPDFJS();
      
      // 3. Intercept XMLHttpRequest for THREE.js FileLoader and PDF.js
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        let finalUrl = url;
        let needsReplacement = false;
        
        // Check if this is a GLB/GLTF model request
        if (url && (url.includes('.glb') || url.includes('.gltf'))) {
          console.log('[3D Viewer] Intercepting XHR GLB request:', url);
          needsReplacement = true;
          
          if (urlsReceived) {
            // Determine which model is being requested
            if (url.includes('united') || url.includes('United')) {
              if (fileUrls.unitedModelUrl) {
                finalUrl = fileUrls.unitedModelUrl;
                console.log('[3D Viewer] Replacing XHR with signed URL:', finalUrl);
              }
            } else if (url.includes('separate') || url.includes('Separate')) {
              if (fileUrls.separateModelUrl) {
                finalUrl = fileUrls.separateModelUrl;
                console.log('[3D Viewer] Replacing XHR with signed URL:', finalUrl);
              }
            } else if (fileUrls.unitedModelUrl) {
              // Default to united model
              finalUrl = fileUrls.unitedModelUrl;
              console.log('[3D Viewer] Replacing XHR with signed URL (default):', finalUrl);
            }
          } else {
            // Store this XHR for later retry
            console.log('[3D Viewer] Delaying XHR request until URLs are received');
            this._delayedRequest = { method, url, rest };
          }
        }
        
        // Check if this is a PDF request (for PDF.js worker)
        if (url && url.includes('.pdf')) {
          console.log('[3D Viewer] Intercepting XHR PDF request:', url);
          needsReplacement = true;
          
          if (urlsReceived && fileUrls.pdfUrl) {
            finalUrl = fileUrls.pdfUrl;
            console.log('[3D Viewer] Replacing XHR PDF with signed URL:', finalUrl);
          } else if (!urlsReceived) {
            console.log('[3D Viewer] Delaying XHR PDF request until URLs are received');
            this._delayedRequest = { method, url, rest };
          }
        }
        
        return originalXHROpen.call(this, method, finalUrl, ...rest);
      };
      
      // Intercept send to delay it if needed
      XMLHttpRequest.prototype.send = function(...args) {
        if (this._delayedRequest) {
          console.log('[3D Viewer] Delaying XHR send until URLs arrive');
          const xhr = this;
          const request = this._delayedRequest;
          
          // Wait for URLs then retry
          const checkAndSend = () => {
            if (urlsReceived) {
              console.log('[3D Viewer] Retrying delayed XHR request');
              delete xhr._delayedRequest;
              
              // Determine the correct URL now
              let finalUrl = request.url;
              if (request.url.includes('.glb') || request.url.includes('.gltf')) {
                if (request.url.includes('united') || request.url.includes('United')) {
                  finalUrl = fileUrls.unitedModelUrl || request.url;
                } else if (request.url.includes('separate') || request.url.includes('Separate')) {
                  finalUrl = fileUrls.separateModelUrl || request.url;
                } else {
                  finalUrl = fileUrls.unitedModelUrl || request.url;
                }
              } else if (request.url.includes('.pdf')) {
                finalUrl = fileUrls.pdfUrl || request.url;
              }
              
              // Re-open with correct URL and send
              originalXHROpen.call(xhr, request.method, finalUrl, ...request.rest);
              originalXHRSend.call(xhr, ...args);
            } else {
              // Check again in 100ms
              setTimeout(checkAndSend, 100);
            }
          };
          
          checkAndSend();
          return;
        }
        
        return originalXHRSend.call(this, ...args);
      };
      
      // 4. Intercept export/download functions
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = function(tagName) {
        const element = originalCreateElement(tagName);
        
        if (tagName.toLowerCase() === 'a') {
          console.log('[3D Viewer] Created anchor element');
          
          // Monitor attribute changes
          const originalSetAttribute = element.setAttribute.bind(element);
          element.setAttribute = function(name, value) {
            console.log('[3D Viewer] Setting attribute:', name, '=', value?.substring?.(0, 100));
            
            // Check if setting href or download
            if (name === 'href' && value && (value.startsWith('data:') || value.startsWith('blob:'))) {
              console.log('[3D Viewer] Detected data/blob URL being set on anchor');
            }
            
            return originalSetAttribute(name, value);
          };
          
          // Intercept link clicks for downloads
          const originalClick = element.click.bind(element);
          element.click = function() {
            const href = element.getAttribute('href');
            const download = element.getAttribute('download');
            
            console.log('[3D Viewer] Anchor clicked - href:', href?.substring?.(0, 100), 'download:', download);
            
            // If this is a download link with data or blob
            if (download && href) {
              if (href.startsWith('data:')) {
                console.log('[3D Viewer] Intercepting data: URL download:', download);
                
                // Extract the JSON data
                try {
                  const base64Data = href.split(',')[1];
                  const jsonString = atob(base64Data);
                  const exportData = JSON.parse(jsonString);
                  
                  console.log('[3D Viewer] Parsed export data:', {
                    movements: exportData.movements?.length,
                    keys: Object.keys(exportData)
                  });
                  
                  // Send to parent app
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: 'EXPORT_DATA',
                      planId: '${planId}',
                      data: exportData,
                      filename: download
                    }, '*');
                    
                    console.log('[3D Viewer] Export data sent to parent app');
                    return; // Don't trigger the download
                  }
                } catch (error) {
                  console.error('[3D Viewer] Error processing data: export:', error);
                }
              } else if (href.startsWith('blob:')) {
                console.log('[3D Viewer] Intercepting blob: URL download:', download);
                
                // Fetch the blob content
                fetch(href)
                  .then(res => res.text())
                  .then(text => {
                    try {
                      const exportData = JSON.parse(text);
                      
                      console.log('[3D Viewer] Parsed blob export data:', {
                        movements: exportData.movements?.length,
                        keys: Object.keys(exportData)
                      });
                      
                      // Send to parent app
                      if (window.parent && window.parent !== window) {
                        window.parent.postMessage({
                          type: 'EXPORT_DATA',
                          planId: '${planId}',
                          data: exportData,
                          filename: download
                        }, '*');
                        
                        console.log('[3D Viewer] Export data sent to parent app');
                      }
                    } catch (error) {
                      console.error('[3D Viewer] Error parsing blob content:', error);
                    }
                  })
                  .catch(error => {
                    console.error('[3D Viewer] Error fetching blob:', error);
                  });
                
                return; // Don't trigger the download
              }
            }
            
            // If not intercepted, proceed with normal click
            console.log('[3D Viewer] Proceeding with normal click');
            originalClick();
          };
        }
        
        return element;
      };
      
      // 4b. Also intercept Blob URLs
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = function(blob) {
        console.log('[3D Viewer] Creating object URL for blob:', blob.type, blob.size);
        return originalCreateObjectURL(blob);
      };
      
      // 4c. Provide a global export function that viewers can call directly
      window.exportToParent = function(exportData, filename) {
        console.log('[3D Viewer] exportToParent called with:', {
          movements: exportData?.movements?.length,
          filename
        });
        
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'EXPORT_DATA',
            planId: '${planId}',
            data: exportData,
            filename: filename || 'export.json'
          }, '*');
          
          console.log('[3D Viewer] Export data sent to parent app via exportToParent');
          return true;
        }
        
        return false;
      };
      
      // 5. Notify parent that viewer is ready
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'VIEWER_READY',
          planId: '${planId}'
        }, '*');
        console.log('[3D Viewer] Viewer ready notification sent to parent');
      }
      
      // 6. Provide helper functions for manual URL injection and import
      window.injectFileUrls = function(urls) {
        console.log('[3D Viewer] Manually injecting URLs:', urls);
        fileUrls = urls;
        
        // Try to reload models if there's a reload function
        if (window.reloadModels) {
          window.reloadModels();
        }
      };
      
      window.requestImport = function() {
        console.log('[3D Viewer] Requesting import from parent');
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'REQUEST_IMPORT',
            planId: '${planId}'
          }, '*');
        }
      };
      
      console.log('[3D Viewer] Auto-integration complete');
    })();
  </script>
  `;

  // Find the closing </head> tag and inject the viewport meta and CSS in the head
  let modifiedHtml = htmlContent;
  
  // Inject viewport meta and CSS in <head>
  if (modifiedHtml.includes('</head>')) {
    modifiedHtml = modifiedHtml.replace('</head>', viewportMeta + '\n' + cssInjection + '\n</head>');
  } 
  // If no </head>, try after <head>
  else if (modifiedHtml.includes('<head>')) {
    modifiedHtml = modifiedHtml.replace('<head>', '<head>\n' + viewportMeta + '\n' + cssInjection);
  }
  // If no <head>, inject after <html>
  else if (modifiedHtml.includes('<html>')) {
    modifiedHtml = modifiedHtml.replace('<html>', '<html>\n<head>\n' + viewportMeta + '\n' + cssInjection + '\n</head>');
  }
  // If no <html>, prepend to the start
  else {
    modifiedHtml = '<head>\n' + viewportMeta + '\n' + cssInjection + '\n</head>\n' + modifiedHtml;
  }
  
  // Inject script before </body>
  if (modifiedHtml.includes('</body>')) {
    modifiedHtml = modifiedHtml.replace('</body>', injectionScript + '\n</body>');
  } 
  // If no </body>, try before </html>
  else if (modifiedHtml.includes('</html>')) {
    modifiedHtml = modifiedHtml.replace('</html>', injectionScript + '\n</html>');
  } 
  // If neither exists, append to the end
  else {
    modifiedHtml += injectionScript;
  }

  console.log('[HTML Modifier] HTML auto-modification complete (CSS + Script injected)');
  return modifiedHtml;
}

/**
 * Extract metadata from HTML if available
 */
export function extractHtmlMetadata(htmlContent: string): {
  title?: string;
  description?: string;
} {
  const metadata: { title?: string; description?: string } = {};
  
  // Try to extract title
  const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    metadata.title = titleMatch[1];
  }
  
  // Try to extract description from meta tag
  const descMatch = htmlContent.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (descMatch) {
    metadata.description = descMatch[1];
  }
  
  return metadata;
}

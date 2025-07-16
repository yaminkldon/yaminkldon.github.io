/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

if (!pdfjsLib.getDocument || !pdfjsViewer.PDFViewer) {
  // eslint-disable-next-line no-alert
  alert("Please build the pdfjs-dist library using\n `gulp dist-install`");
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVoy2aBaQO1RDpoGGPIBqriFnGdKeNqHk",
  authDomain: "raednusairat-68b52.firebaseapp.com",
  databaseURL: "https://raednusairat-68b52-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "raednusairat-68b52",
  storageBucket: "raednusairat-68b52.appspot.com",
  messagingSenderId: "852022576722",
  appId: "1:852022576722:web:8546d7cd4d3f6b0f8fc18b",
  measurementId: "G-HDLMYVXH5T"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

const USE_ONLY_CSS_ZOOM = true;
const TEXT_LAYER_MODE = 0; // DISABLE
/*  Modified for PDF.js Read Only
 *  To enable PDF large image size
 */
// const MAX_IMAGE_SIZE = 1024 * 1024; // Limited Max Image Size
const MAX_IMAGE_SIZE = false; // Unlimited Max Image Size
const CMAP_URL = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/";
const CMAP_PACKED = true;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/*  Modified for PDF.js Read Only
 *  To enable get query string of file
 *  How can I get query string values in JavaScript? https://stackoverflow.com/a/901144/17754812
 */
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex   = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

const DEFAULT_SCALE_DELTA = 1.1;
const MIN_SCALE = 0.25;
const MAX_SCALE = 10.0;
const DEFAULT_SCALE_VALUE = "page-fit";

// Security functions
function detectDevToolsInViewer() {
  let devtools = {
    open: false,
    orientation: null
  };
  
  // More lenient threshold for mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const threshold = isMobile ? 200 : 300; // Higher threshold for mobile
  
  setInterval(() => {
    // Additional check to prevent false positives on mobile
    const heightDiff = window.outerHeight - window.innerHeight;
    const widthDiff = window.outerWidth - window.innerWidth;
    
    // Only trigger if both dimensions suggest dev tools (not just mobile keyboard)
    if (heightDiff > threshold && widthDiff > 50) {
      if (!devtools.open) {
        devtools.open = true;
        
        // Send message to parent window
        if (window.parent) {
          window.parent.postMessage({
            type: 'pdf-security-warning',
            message: 'Developer tools detected in PDF viewer'
          }, '*');
        }
        
        // Close viewer
        document.body.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #dc3545; color: white; font-family: Arial, sans-serif; text-align: center;">
            <div>
              <h2>⚠️ Security Violation</h2>
              <p>Developer tools detected. PDF viewer has been closed.</p>
            </div>
          </div>
        `;
      }
    } else {
      devtools.open = false;
    }
  }, 1000); // Less frequent checking
}

function addStaticWatermark(userEmail) {
  const watermarkContainer = document.getElementById('pdfWatermark');
  if (!watermarkContainer) return;
  
  // Clear existing watermarks
  watermarkContainer.innerHTML = '';
  
  // Create multiple static watermarks that will be positioned dynamically
  const watermarkPositions = [
    { top: '10%', left: '10%' },
    { top: '10%', right: '10%' },
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    { bottom: '10%', left: '10%' },
    { bottom: '10%', right: '10%' },
    { top: '30%', left: '30%' },
    { top: '70%', right: '30%' },
    { top: '25%', right: '25%' },
    { bottom: '25%', left: '50%', transform: 'translateX(-50%)' }
  ];
  
  watermarkPositions.forEach((position, index) => {
    const watermark = document.createElement('div');
    watermark.className = 'pdf-watermark-item';
    watermark.style.cssText = `
      position: fixed;
      color: rgba(0, 0, 0, 0.08);
      font-size: 12px;
      font-weight: bold;
      font-family: Arial, sans-serif;
      user-select: none;
      pointer-events: none;
      transform: rotate(-20deg);
      z-index: 1001;
      white-space: nowrap;
      ${position.top ? `top: ${position.top};` : ''}
      ${position.bottom ? `bottom: ${position.bottom};` : ''}
      ${position.left ? `left: ${position.left};` : ''}
      ${position.right ? `right: ${position.right};` : ''}
      ${position.transform ? `transform: ${position.transform} rotate(-20deg);` : ''}
    `;
    watermark.textContent = userEmail;
    watermarkContainer.appendChild(watermark);
  });
  
  // Show watermark container
  watermarkContainer.style.display = 'block';
  
  // Update watermark positions when window resizes or scrolls
  function updateWatermarkPositions() {
    const watermarks = document.querySelectorAll('.pdf-watermark-item');
    watermarks.forEach(watermark => {
      // Keep watermarks visible and positioned correctly
      watermark.style.position = 'fixed';
    });
  }
  
  // Add listeners for dynamic positioning
  window.addEventListener('resize', updateWatermarkPositions);
  window.addEventListener('scroll', updateWatermarkPositions);
  
  // Initial positioning update
  setTimeout(updateWatermarkPositions, 100);
}

function getSecureFileUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const proxyKey = urlParams.get('p');
  
  if (proxyKey) {
    // Get URL from secure proxy
    const proxyData = sessionStorage.getItem('proxy_' + proxyKey);
    if (proxyData) {
      try {
        const data = JSON.parse(atob(proxyData));
        return data.url;
      } catch (e) {
        console.error('Error parsing proxy data');
        return null;
      }
    }
  }
  
  // Fallback to direct file parameter (less secure)
  return urlParams.get('file');
}

/*  Modified for PDF.js Read Only
 *  To get query string of file or using default PDF file
 */
// Get PDF file whether from secure proxy or "file" query string
var file = getSecureFileUrl();
const DEFAULT_URL = (file === null || file === "") ? "web/compressed.tracemonkey-pldi-09.pdf" : file;

const PDFViewerApplication = {
  pdfLoadingTask: null,
  pdfDocument: null,
  pdfViewer: null,
  pdfHistory: null,
  pdfLinkService: null,
  eventBus: null,

  /**
   * Opens PDF document specified by URL.
   * @returns {Promise} - Returns the promise, which is resolved when document
   *                      is opened.
   */
  async open(params) {
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document
      return this.close().then(
        function () {
          // ... and repeat the open() call.
          return this.open(params);
        }.bind(this)
      );
    }

    let url = params.url;
    const self = this;
    
    // Handle Firebase storage URLs
    if (url && !url.startsWith('http')) {
      try {
        const corsHandler = new FirebaseStorageCORSHandler();
        const storageRef = storage.ref(url);
        url = await storageRef.getDownloadURL();
        url = await corsHandler.handleFirebaseStorageUrl(url);
      } catch (error) {
        console.error('Error getting Firebase URL:', error);
      }
    }
    
    this.setTitleUsingUrl(url);

    // Loading document with higher quality settings
    const loadingTask = pdfjsLib.getDocument({
      url,
      maxImageSize: MAX_IMAGE_SIZE,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      disableAutoFetch: false,
      disableStream: false,
      disableFontFace: false
    });
    this.pdfLoadingTask = loadingTask;

    loadingTask.onProgress = function (progressData) {
      self.progress(progressData.loaded / progressData.total);
    };

    return loadingTask.promise.then(
      function (pdfDocument) {
        // Document loaded, specifying document for the viewer.
        self.pdfDocument = pdfDocument;
        self.pdfViewer.setDocument(pdfDocument);
        self.pdfLinkService.setDocument(pdfDocument);
        self.pdfHistory.initialize({ fingerprint: pdfDocument.fingerprint });

        self.loadingBar.hide();
        /*  Modified for PDF.js Read Only
         *  To hide Custom Progress Document Loading
         */
        const customProgress = document.getElementById('customProgress');
        if (customProgress) {
          customProgress.style.display = 'none';
        }
        
        // Add watermark with user email
        const urlParams = new URLSearchParams(window.location.search);
        const proxyKey = urlParams.get('p');
        let userEmail = 'Student';
        
        if (proxyKey) {
          const proxyData = sessionStorage.getItem('proxy_' + proxyKey);
          if (proxyData) {
            try {
              const data = JSON.parse(atob(proxyData));
              userEmail = data.user || 'Student';
            } catch (e) {
              console.error('Error parsing user data');
            }
          }
        }
        
        addStaticWatermark(userEmail);
        
        self.setTitleUsingMetadata(pdfDocument);
      },
      function (exception) {
        const message = exception && exception.message;
        const l10n = self.l10n;
        let loadingErrorMessage;

        if (exception instanceof pdfjsLib.InvalidPDFException) {
          // change error message also for other builds
          loadingErrorMessage = l10n.get(
            "invalid_file_error",
            null,
            "Invalid or corrupted PDF file."
          );
        } else if (exception instanceof pdfjsLib.MissingPDFException) {
          // special message for missing PDFs
          loadingErrorMessage = l10n.get(
            "missing_file_error",
            null,
            "Missing PDF file."
          );
        } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
          loadingErrorMessage = l10n.get(
            "unexpected_response_error",
            null,
            "Unexpected server response."
          );
        } else {
          loadingErrorMessage = l10n.get(
            "loading_error",
            null,
            "An error occurred while loading the PDF."
          );
        }

        loadingErrorMessage.then(function (msg) {
          self.error(msg, { message });
        });
        self.loadingBar.hide();
        /*  Modified for PDF.js Read Only
         *  To hide Custom Progress Document Loading
         */
        const customProgress = document.getElementById('customProgress');
        if (customProgress) {
          customProgress.style.display = 'none';
        }
      }
    );
  },

  /**
   * Closes opened PDF document.
   * @returns {Promise} - Returns the promise, which is resolved when all
   *                      destruction is completed.
   */
  close() {
    const errorWrapper = document.getElementById("errorWrapper");
    if (errorWrapper) {
      errorWrapper.hidden = true;
    }

    if (!this.pdfLoadingTask) {
      return Promise.resolve();
    }

    const promise = this.pdfLoadingTask.destroy();
    this.pdfLoadingTask = null;

    if (this.pdfDocument) {
      this.pdfDocument = null;

      this.pdfViewer.setDocument(null);
      this.pdfLinkService.setDocument(null, null);

      if (this.pdfHistory) {
        this.pdfHistory.reset();
      }
    }

    return promise;
  },

  get loadingBar() {
    const bar = new pdfjsViewer.ProgressBar("#loadingBar", {});

    return pdfjsLib.shadow(this, "loadingBar", bar);
  },

  setTitleUsingUrl: function pdfViewSetTitleUsingUrl(url) {
    this.url = url;
    let title = pdfjsLib.getFilenameFromUrl(url) || url;
    try {
      title = decodeURIComponent(title);
    } catch (e) {
      // decodeURIComponent may throw URIError,
      // fall back to using the unprocessed url in that case
    }
    this.setTitle(title);
  },

  setTitleUsingMetadata(pdfDocument) {
    const self = this;
    pdfDocument.getMetadata().then(function (data) {
      const info = data.info,
        metadata = data.metadata;
      self.documentInfo = info;
      self.metadata = metadata;

      // Provides some basic debug information
      console.log(
        "PDF " +
          pdfDocument.fingerprint +
          " [" +
          info.PDFFormatVersion +
          " " +
          (info.Producer || "-").trim() +
          " / " +
          (info.Creator || "-").trim() +
          "]" +
          " (PDF.js: " +
          (pdfjsLib.version || "-") +
          ")"
      );

      let pdfTitle;
      if (metadata && metadata.has("dc:title")) {
        const title = metadata.get("dc:title");
        // Ghostscript sometimes returns 'Untitled', so prevent setting the
        // title to 'Untitled.
        if (title !== "Untitled") {
          pdfTitle = title;
        }
      }

      if (!pdfTitle && info && info.Title) {
        pdfTitle = info.Title;
      }

      if (pdfTitle) {
        self.setTitle(pdfTitle + " - " + document.title);
      }
    });
  },

  setTitle: function pdfViewSetTitle(title) {
    document.title = title;
    const titleElement = document.getElementById("title");
    if (titleElement) {
      titleElement.textContent = title;
    }
  },

  error: function pdfViewError(message, moreInfo) {
    const l10n = this.l10n;
    const moreInfoText = [
      l10n.get(
        "error_version_info",
        { version: pdfjsLib.version || "?", build: pdfjsLib.build || "?" },
        "PDF.js v{{version}} (build: {{build}})"
      ),
    ];

    if (moreInfo) {
      moreInfoText.push(
        l10n.get(
          "error_message",
          { message: moreInfo.message },
          "Message: {{message}}"
        )
      );
      if (moreInfo.stack) {
        moreInfoText.push(
          l10n.get("error_stack", { stack: moreInfo.stack }, "Stack: {{stack}}")
        );
      } else {
        if (moreInfo.filename) {
          moreInfoText.push(
            l10n.get(
              "error_file",
              { file: moreInfo.filename },
              "File: {{file}}"
            )
          );
        }
        if (moreInfo.lineNumber) {
          moreInfoText.push(
            l10n.get(
              "error_line",
              { line: moreInfo.lineNumber },
              "Line: {{line}}"
            )
          );
        }
      }
    }

    const errorWrapper = document.getElementById("errorWrapper");
    if (errorWrapper) {
      errorWrapper.hidden = false;
    }

    const errorMessage = document.getElementById("errorMessage");
    if (errorMessage) {
      errorMessage.textContent = message;
    }

    const closeButton = document.getElementById("errorClose");
    if (closeButton) {
      closeButton.onclick = function () {
        errorWrapper.hidden = true;
      };
    }

    const errorMoreInfo = document.getElementById("errorMoreInfo");
    const moreInfoButton = document.getElementById("errorShowMore");
    const lessInfoButton = document.getElementById("errorShowLess");
    if (moreInfoButton && lessInfoButton && errorMoreInfo) {
      moreInfoButton.onclick = function () {
        errorMoreInfo.hidden = false;
        moreInfoButton.hidden = true;
        lessInfoButton.hidden = false;
        errorMoreInfo.style.height = errorMoreInfo.scrollHeight + "px";
      };
      lessInfoButton.onclick = function () {
        errorMoreInfo.hidden = true;
        moreInfoButton.hidden = false;
        lessInfoButton.hidden = true;
      };
      moreInfoButton.hidden = false;
      lessInfoButton.hidden = true;
      Promise.all(moreInfoText).then(function (parts) {
        errorMoreInfo.value = parts.join("\n");
      });
    }
  },

  progress: function pdfViewProgress(level) {
    const percent = Math.round(level * 100);
    // Updating the bar if value increases.
    if (percent > this.loadingBar.percent || isNaN(percent)) {
      this.loadingBar.percent = percent;
    }
  },

  get pagesCount() {
    return this.pdfDocument.numPages;
  },

  get page() {
    return this.pdfViewer.currentPageNumber;
  },

  set page(val) {
    this.pdfViewer.currentPageNumber = val;
  },

  zoomIn: function pdfViewZoomIn(ticks) {
    let newScale = this.pdfViewer.currentScale;
    do {
      newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.ceil(newScale * 10) / 10;
      newScale = Math.min(MAX_SCALE, newScale);
    } while (--ticks && newScale < MAX_SCALE);
    this.pdfViewer.currentScaleValue = newScale;
  },

  zoomOut: function pdfViewZoomOut(ticks) {
    let newScale = this.pdfViewer.currentScale;
    do {
      newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
      newScale = Math.floor(newScale * 10) / 10;
      newScale = Math.max(MIN_SCALE, newScale);
    } while (--ticks && newScale > MIN_SCALE);
    this.pdfViewer.currentScaleValue = newScale;
  },

  initUI: function pdfViewInitUI() {
    const eventBus = new pdfjsViewer.EventBus();
    this.eventBus = eventBus;

    const linkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });
    this.pdfLinkService = linkService;

    this.l10n = pdfjsViewer.NullL10n;

    const container = document.getElementById("viewerContainer");
    const pdfViewer = new pdfjsViewer.PDFViewer({
      container,
      eventBus,
      linkService,
      l10n: this.l10n,
      useOnlyCssZoom: USE_ONLY_CSS_ZOOM,
      textLayerMode: TEXT_LAYER_MODE,
    });
    this.pdfViewer = pdfViewer;
    linkService.setViewer(pdfViewer);

    this.pdfHistory = new pdfjsViewer.PDFHistory({
      eventBus,
      linkService,
    });
    linkService.setHistory(this.pdfHistory);

    // Navigation buttons
    const prevBtn = document.getElementById("previous");
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        PDFViewerApplication.page--;
      });
    }

    const nextBtn = document.getElementById("next");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        PDFViewerApplication.page++;
      });
    }

    const zoomInBtn = document.getElementById("zoomIn");
    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", function () {
        PDFViewerApplication.zoomIn();
      });
    }

    const zoomOutBtn = document.getElementById("zoomOut");
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", function () {
        PDFViewerApplication.zoomOut();
      });
    }

    const pageNumberInput = document.getElementById("pageNumber");
    if (pageNumberInput) {
      pageNumberInput.addEventListener("click", function () {
        this.select();
      });

      pageNumberInput.addEventListener("change", function () {
        PDFViewerApplication.page = this.value | 0;

        // Ensure that the page number input displays the correct value,
        // even if the value entered by the user was invalid
        // (e.g. a floating point number).
        if (this.value !== PDFViewerApplication.page.toString()) {
          this.value = PDFViewerApplication.page;
        }
      });
    }

    // Set up pagesinit event listener for proper page-fit scaling
    eventBus.on("pagesinit", function () {
      // We can use pdfViewer now, e.g. let's change default scale.
      pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
    });

    eventBus.on(
      "pagechanging",
      function (evt) {
        const page = evt.pageNumber;
        const numPages = PDFViewerApplication.pagesCount;

        if (pageNumberInput) {
          pageNumberInput.value = page;
        }
        if (prevBtn) {
          prevBtn.disabled = page <= 1;
        }
        if (nextBtn) {
          nextBtn.disabled = page >= numPages;
        }
      },
      true
    );
    
    // Start developer tools detection
    detectDevToolsInViewer();
  },
};

window.PDFViewerApplication = PDFViewerApplication;

document.addEventListener(
  "DOMContentLoaded",
  function () {
    PDFViewerApplication.initUI();
  },
  true
);

// The offsetParent is not set until the PDF.js iframe or object is visible;
// waiting for first animation.
const animationStarted = new Promise(function (resolve) {
  window.requestAnimationFrame(resolve);
});

// We need to delay opening until all HTML is loaded.
animationStarted.then(function () {
  PDFViewerApplication.open({
    url: DEFAULT_URL,
  });
});

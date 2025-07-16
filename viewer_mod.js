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

const USE_ONLY_CSS_ZOOM = true;
const TEXT_LAYER_MODE = 0; // DISABLE
/*  Modified for PDF.js Read Only
 *  To enable PDF large image size
 */
// const MAX_IMAGE_SIZE = 1024 * 1024; // Limited Max Image Size
const MAX_IMAGE_SIZE = false; // Unlimited Max Image Size
const CMAP_URL = "web/cmaps/";
const CMAP_PACKED = true;
const DEFAULT_SCALE_DELTA = 1.1;
const MIN_SCALE = 0.25;
const MAX_SCALE = 10.0;
const DEFAULT_SCALE_VALUE = "auto";

const pdfjsViewer = globalThis.pdfjsViewer;
const pdfjsLib = globalThis.pdfjsLib;

// Get PDF file whether from "DEFAULT_URL" or "file" query string
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)");
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// const DEFAULT_URL = "web/compressed.tracemonkey-pldi-09.pdf";
// Get PDF file whether from "DEFAULT_URL" or "file" query string
const file = getParameterByName('file');
const DEFAULT_URL = (file === null || file === "") ? "web/compressed.tracemonkey-pldi-09" : file;

const PDFViewerApplication = {
  pdfLoadingTask: null,
  pdfDocument: null,
  pdfViewer: null,
  pdfHistory: null,
  pdfLinkService: null,
  eventBus: null,
  l10n: null,
  
  /**
   * @returns {Promise} a promise that is resolved when the PDF viewer is ready
   */
  open: function pdfViewOpen(params) {
    if (this.pdfLoadingTask) {
      return this.close().then(() => {
        return this.open(params);
      });
    }
    
    const url = params.url;
    const loadingTask = pdfjsLib.getDocument({
      url,
      maxImageSize: MAX_IMAGE_SIZE,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    });
    
    this.pdfLoadingTask = loadingTask;
    
    loadingTask.onProgress = (progressData) => {
      this.progress(progressData.loaded / progressData.total);
    };
    
    return loadingTask.promise
      .then((pdfDocument) => {
        this.pdfDocument = pdfDocument;
        this.pdfViewer.setDocument(pdfDocument);
        this.pdfLinkService.setDocument(pdfDocument);
        this.pdfHistory.initialize({ fingerprint: pdfDocument.fingerprint });
        
        this.loadingBar.hide();
        this.setTitleUsingMetadata(pdfDocument);
        
        // Hide custom progress and show viewer
        const customProgress = document.getElementById('customProgress');
        if (customProgress) {
          customProgress.style.display = 'none';
        }
      })
      .catch((exception) => {
        const message = exception && exception.message;
        const loadingErrorMessage = "An error occurred while loading the PDF.";
        
        if (exception instanceof pdfjsLib.InvalidPDFException) {
          this.error(loadingErrorMessage, { message });
        } else if (exception instanceof pdfjsLib.MissingPDFException) {
          this.error(loadingErrorMessage, { message });
        } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
          this.error(loadingErrorMessage, { message });
        } else {
          this.error(loadingErrorMessage, { message });
        }
        
        this.loadingBar.hide();
      });
  },
  
  /**
   * @returns {Promise} a promise that is resolved when the PDF viewer is closed
   */
  close: function pdfViewClose() {
    if (!this.pdfLoadingTask) {
      return Promise.resolve();
    }
    
    const promise = this.pdfLoadingTask.destroy();
    this.pdfLoadingTask = null;
    
    if (this.pdfDocument) {
      this.pdfDocument = null;
      this.pdfViewer.setDocument(null);
      this.pdfLinkService.setDocument(null, null);
      this.pdfHistory.reset();
    }
    
    return promise;
  },
  
  get loadingBar() {
    const bar = document.getElementById("loadingBar");
    return pdfjsLib.shadow(this, "loadingBar", {
      show: function() {
        bar.classList.remove("hidden");
      },
      hide: function() {
        bar.classList.add("hidden");
      }
    });
  },
  
  setTitleUsingMetadata: function pdfViewSetTitleUsingMetadata(pdfDocument) {
    pdfDocument.getMetadata().then((data) => {
      const info = data.info;
      const metadata = data.metadata;
      
      let title = info.Title || "";
      if (title.trim() === "") {
        title = "PDF.js viewer";
      }
      
      document.title = title;
      document.getElementById("title").textContent = title;
    });
  },
  
  error: function pdfViewError(message, moreInfo) {
    const l10n = this.l10n;
    const moreInfoText = [`PDF.js v${pdfjsLib.version || "?"} (build: ${pdfjsLib.build || "?"})`];
    
    if (moreInfo) {
      moreInfoText.push(
        l10n.get("error_message", { message: moreInfo.message }, "Message: {{message}}")
      );
      if (moreInfo.stack) {
        moreInfoText.push(
          l10n.get("error_stack", { stack: moreInfo.stack }, "Stack: {{stack}}")
        );
      } else {
        if (moreInfo.filename) {
          moreInfoText.push(
            l10n.get("error_file", { file: moreInfo.filename }, "File: {{file}}")
          );
        }
        if (moreInfo.lineNumber) {
          moreInfoText.push(
            l10n.get("error_line", { line: moreInfo.lineNumber }, "Line: {{line}}")
          );
        }
      }
    }
    
    const errorWrapper = document.getElementById("errorWrapper");
    errorWrapper.hidden = false;
    
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    
    const closeButton = document.getElementById("errorClose");
    closeButton.onclick = function() {
      errorWrapper.hidden = true;
    };
    
    const errorMoreInfo = document.getElementById("errorMoreInfo");
    const moreInfoButton = document.getElementById("errorShowMore");
    const lessInfoButton = document.getElementById("errorShowLess");
    moreInfoButton.onclick = function() {
      errorMoreInfo.hidden = false;
      moreInfoButton.hidden = true;
      lessInfoButton.hidden = false;
      errorMoreInfo.style.height = errorMoreInfo.scrollHeight + "px";
    };
    lessInfoButton.onclick = function() {
      errorMoreInfo.hidden = true;
      moreInfoButton.hidden = false;
      lessInfoButton.hidden = true;
    };
    moreInfoButton.hidden = false;
    lessInfoButton.hidden = true;
    Promise.all(moreInfoText).then(function(parts) {
      errorMoreInfo.value = parts.join("\n");
    });
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
    
    document.getElementById("previous").addEventListener("click", function() {
      PDFViewerApplication.page--;
    });
    
    document.getElementById("next").addEventListener("click", function() {
      PDFViewerApplication.page++;
    });
    
    document.getElementById("zoomIn").addEventListener("click", function() {
      PDFViewerApplication.zoomIn();
    });
    
    document.getElementById("zoomOut").addEventListener("click", function() {
      PDFViewerApplication.zoomOut();
    });
    
    document.getElementById("pageNumber").addEventListener("click", function() {
      this.select();
    });
    
    document.getElementById("pageNumber").addEventListener("change", function() {
      PDFViewerApplication.page = this.value | 0;
      
      // Ensure that the page number input displays the correct value,
      // even if the value entered by the user was invalid
      // (e.g. a floating point number).
      if (this.value !== PDFViewerApplication.page.toString()) {
        this.value = PDFViewerApplication.page;
      }
    });
    
    eventBus.on("pagesinit", function() {
      // We can use pdfViewer now, e.g. let's change default scale.
      pdfViewer.currentScaleValue = DEFAULT_SCALE_VALUE;
    });
    
    eventBus.on("pagechanging", function(evt) {
      const page = evt.pageNumber;
      const numPages = PDFViewerApplication.pagesCount;
      
      document.getElementById("pageNumber").value = page;
      document.getElementById("previous").disabled = page <= 1;
      document.getElementById("next").disabled = page >= numPages;
    }, true);
  },
};

window.PDFViewerApplication = PDFViewerApplication;

document.addEventListener("DOMContentLoaded", function() {
  PDFViewerApplication.initUI();
}, true);

// The offsetParent is not set until the PDF.js iframe or object is visible;
// waiting for first animation.
const animationStarted = new Promise(function(resolve) {
  window.requestAnimationFrame(resolve);
});

// We need to delay opening until all HTML is loaded.
animationStarted.then(function() {
  PDFViewerApplication.open({
    url: DEFAULT_URL,
  });
});

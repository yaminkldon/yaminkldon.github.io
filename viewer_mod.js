// PDF.js Readonly Viewer - CDN Version with Security Features
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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

// PDF Viewer Application
const PDFViewerApplication = {
  pdfDocument: null,
  currentPageNumber: 1,
  numPages: 0,
  scale: 1.0, // Default zoom
  
  async initialize() {
    this.container = document.getElementById('viewer');
    this.pageNumber = document.getElementById('pageNumber');
    this.customProgress = document.getElementById('customProgress');
    this.errorWrapper = document.getElementById('errorWrapper');
    
    // Start developer tools detection
    detectDevToolsInViewer();
    
    // Get file parameter from secure proxy or URL
    const fileParam = getSecureFileUrl();
    
    if (fileParam) {
      await this.loadPDF(fileParam);
    } else {
      this.showError('No file parameter specified');
    }
    
    this.setupEventListeners();
  },
  
  async loadPDF(filePath) {
    try {
      this.showProgress(true);
      
      // Use Firebase CORS handler
      const corsHandler = new FirebaseStorageCORSHandler();
      let pdfUrl;
      
      if (filePath.startsWith('http')) {
        pdfUrl = filePath;
      } else {
        // Get Firebase storage URL
        const storageRef = storage.ref(filePath);
        pdfUrl = await storageRef.getDownloadURL();
      }
      
      // Handle CORS if needed
      pdfUrl = await corsHandler.handleFirebaseStorageUrl(pdfUrl);
      
      // Load PDF document with higher quality settings
      const loadingTask = pdfjsLib.getDocument({
        url: pdfUrl,
        maxImageSize: -1, // Unlimited image size for better quality
        disableAutoFetch: false,
        disableStream: false,
        disableFontFace: false,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });
      
      this.pdfDocument = await loadingTask.promise;
      this.numPages = this.pdfDocument.numPages;
      
      // Update page number input
      this.pageNumber.max = this.numPages;
      
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
      
      // Render first page
      await this.renderPage(1);
      
      this.showProgress(false);
      
    } catch (error) {
      console.error('Error loading PDF:', error);
      this.showError('Failed to load PDF: ' + error.message);
    }
  },
  
  async renderPage(pageNum) {
    try {
      const page = await this.pdfDocument.getPage(pageNum);
      
      // Use higher scale for better quality when zoomed out
      const baseScale = this.scale;
      const renderScale = Math.max(baseScale, 1.5); // Minimum render scale for quality
      
      const viewport = page.getViewport({ scale: renderScale });
      
      // Create canvas with higher resolution
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set up high-DPI rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      const backingStoreRatio = context.webkitBackingStorePixelRatio ||
                               context.mozBackingStorePixelRatio ||
                               context.msBackingStorePixelRatio ||
                               context.oBackingStorePixelRatio ||
                               context.backingStorePixelRatio || 1;
      
      const ratio = devicePixelRatio / backingStoreRatio;
      
      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      canvas.style.width = viewport.width * (baseScale / renderScale) + 'px';
      canvas.style.height = viewport.height * (baseScale / renderScale) + 'px';
      
      context.scale(ratio, ratio);
      
      // Clear container and add canvas
      this.container.innerHTML = '';
      this.container.appendChild(canvas);
      
      // Render page with high quality
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: 'display'
      };
      
      await page.render(renderContext).promise;
      
      // Update current page number
      this.currentPageNumber = pageNum;
      this.pageNumber.value = pageNum;
      
      // Refresh watermarks after page render
      this.refreshWatermarks();
      
    } catch (error) {
      console.error('Error rendering page:', error);
      this.showError('Failed to render page: ' + error.message);
    }
  },
  
  refreshWatermarks() {
    // Get user email from secure proxy
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
    
    // Re-add watermarks to ensure they're visible
    addStaticWatermark(userEmail);
  },
  
  setupEventListeners() {
    // Navigation buttons
    document.getElementById('previous').addEventListener('click', () => {
      if (this.currentPageNumber > 1) {
        this.renderPage(this.currentPageNumber - 1);
      }
    });
    
    document.getElementById('next').addEventListener('click', () => {
      if (this.currentPageNumber < this.numPages) {
        this.renderPage(this.currentPageNumber + 1);
      }
    });
    
    // Page number input
    this.pageNumber.addEventListener('change', (e) => {
      const pageNum = parseInt(e.target.value);
      if (pageNum >= 1 && pageNum <= this.numPages) {
        this.renderPage(pageNum);
      }
    });
    
    // Zoom buttons
    document.getElementById('zoomIn').addEventListener('click', () => {
      this.scale *= 1.2;
      this.renderPage(this.currentPageNumber);
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
      this.scale /= 1.2;
      this.renderPage(this.currentPageNumber);
    });
    
    // Fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          if (this.currentPageNumber > 1) {
            this.renderPage(this.currentPageNumber - 1);
          }
          break;
        case 'ArrowRight':
          if (this.currentPageNumber < this.numPages) {
            this.renderPage(this.currentPageNumber + 1);
          }
          break;
        case '+':
        case '=':
          this.scale *= 1.2;
          this.renderPage(this.currentPageNumber);
          break;
        case '-':
          this.scale /= 1.2;
          this.renderPage(this.currentPageNumber);
          break;
      }
    });
    
    // Error close button
    document.getElementById('errorClose').addEventListener('click', () => {
      this.showError('');
    });
  },
  
  showProgress(show) {
    if (this.customProgress) {
      this.customProgress.style.display = show ? 'block' : 'none';
    }
  },
  
  showError(message) {
    if (message) {
      document.getElementById('errorMessage').textContent = message;
      this.errorWrapper.hidden = false;
      this.showProgress(false);
    } else {
      this.errorWrapper.hidden = true;
    }
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  PDFViewerApplication.initialize();
});

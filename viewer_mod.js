// PDF.js Readonly Viewer - CDN Version
// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjJHjfFQnBq-5jbgHgPIZNmZJEEBm8m8w",
  authDomain: "mcqbyeach.firebaseapp.com",
  databaseURL: "https://mcqbyeach-default-rtdb.firebaseio.com",
  projectId: "mcqbyeach",
  storageBucket: "mcqbyeach.appspot.com",
  messagingSenderId: "1062619085720",
  appId: "1:1062619085720:web:42b5e6d3636e9f8e10a5b7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();

// PDF Viewer Application
const PDFViewerApplication = {
  pdfDocument: null,
  currentPageNumber: 1,
  numPages: 0,
  scale: 1.0,
  
  async initialize() {
    this.container = document.getElementById('viewer');
    this.pageNumber = document.getElementById('pageNumber');
    this.customProgress = document.getElementById('customProgress');
    this.errorWrapper = document.getElementById('errorWrapper');
    
    // Get file parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    
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
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      this.pdfDocument = await loadingTask.promise;
      this.numPages = this.pdfDocument.numPages;
      
      // Update page number input
      this.pageNumber.max = this.numPages;
      
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
      const viewport = page.getViewport({ scale: this.scale });
      
      // Create canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Clear container and add canvas
      this.container.innerHTML = '';
      this.container.appendChild(canvas);
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      
      // Update current page number
      this.currentPageNumber = pageNum;
      this.pageNumber.value = pageNum;
      
    } catch (error) {
      console.error('Error rendering page:', error);
      this.showError('Failed to render page: ' + error.message);
    }
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

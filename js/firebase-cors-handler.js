 // Firebase Storage CORS Handler
// This script provides utilities to handle Firebase Storage CORS issues

class FirebaseStorageCORSHandler {
  constructor() {
    this.corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
    this.alternativeProxies = [
      'https://api.codetabs.com/v1/proxy?quest=',
      'https://cors-proxy.htmldriven.com/?url='
    ];
  }

  // Handle Firebase Storage URL with CORS proxy
  async handleFirebaseStorageUrl(url) {
    // First try direct access
    try {
      const testResponse = await fetch(url, { method: 'HEAD', mode: 'cors' });
      if (testResponse.ok) {
        return url; // Direct access works
      }
    } catch (error) {
      console.log('Direct access failed, trying proxy methods');
    }

    // Try proxy methods
    for (const proxy of this.alternativeProxies) {
      try {
        const proxiedUrl = proxy + encodeURIComponent(url);
        const testResponse = await fetch(proxiedUrl, { method: 'HEAD' });
        if (testResponse.ok) {
          return proxiedUrl;
        }
      } catch (error) {
        console.log(`Proxy ${proxy} failed, trying next`);
      }
    }

    // If all proxies fail, return original URL
    return url;
  }

  // Load PDF with blob method to bypass CORS
  async loadPDFAsBlob(url) {
    try {
      // Try direct fetch first
      let response;
      try {
        response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
      } catch (corsError) {
        // If CORS fails, try with proxy
        const proxiedUrl = await this.handleFirebaseStorageUrl(url);
        response = await fetch(proxiedUrl, {
          mode: 'cors',
          credentials: 'omit',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error loading PDF as blob:', error);
      throw error;
    }
  }

  // Create a data URL from Firebase Storage URL
  async createDataUrl(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error creating data URL:', error);
      throw error;
    }
  }
}

// Make available globally
window.FirebaseStorageCORSHandler = FirebaseStorageCORSHandler;

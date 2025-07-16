/*  PDF.js Read Only Restriction
 *  Based on: https://github.com/latuminggi/pdf.js_readonly
 *  Modified for Firebase Education Platform - Sandboxed Version
 */

// Read Only Preferences
var disableRghtClck = true; // Disable Right Click,   value: true || false
var disableCopyText = true; // Disable Copy Text,     value: true || false
var disableOpenFile = true; // Disable Open PDF,      value: true || false
var disablePrintPdf = true; // Disable Print PDF,     value: true || false
var disableDownload = true; // Disable Save PDF,      value: true || false
var disablePresents = true; // Disable Presentation,  value: true || false
var disablePrntScrn = true; // Disable Print Screen,  value: true || false (experimental)

// Safe notification function for sandboxed iframe
function showSecurityMessage(message) {
    console.warn('PDF Security: ' + message);
    
    // Try to communicate with parent window
    try {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ 
                type: 'pdf-security-warning', 
                message: message 
            }, '*');
        }
    } catch (e) {
        // Silently handle cross-origin errors
    }
    
    // Show visual feedback instead of alert
    showVisualFeedback(message);
}

// Visual feedback function
function showVisualFeedback(message) {
    // Remove existing feedback
    const existingFeedback = document.getElementById('security-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create new feedback element
    const feedback = document.createElement('div');
    feedback.id = 'security-feedback';
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-out 2.7s;
    `;
    feedback.textContent = message;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(feedback);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.parentNode.removeChild(feedback);
        }
    }, 3000);
}

// Load Specific viewer.js
if (disablePrintPdf) {
    // Load viewer_noprint.js
    const script = document.createElement('script');
    script.src = 'js/viewer_noprint.js';
    script.onerror = function() {
        console.warn('Could not load viewer_noprint.js, using default viewer');
    };
    document.head.appendChild(script);
} else {
    // Load regular viewer.js
    const script = document.createElement('script');
    script.src = 'js/viewer.js';
    script.onerror = function() {
        console.warn('Could not load viewer.js');
    };
    document.head.appendChild(script);
}

// Disable All Keyboard Shortcuts
$(document).keydown(function(e) {
    // Disable F12 (Developer Tools)
    if (e.keyCode == 123) {
        if (disableRghtClck) {
            showSecurityMessage('Developer Tools is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+Shift+I (Developer Tools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 73) {
        if (disableRghtClck) {
            showSecurityMessage('Developer Tools is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+Shift+J (Console)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 74) {
        if (disableRghtClck) {
            showSecurityMessage('Console is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+U (View Source)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 85) {
        if (disableRghtClck) {
            showSecurityMessage('View Source is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+C (Copy)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 67) {
        if (disableCopyText) {
            showSecurityMessage('Copy is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+A (Select All)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 65) {
        if (disableCopyText) {
            showSecurityMessage('Select All is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+O (Open File)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 79) {
        if (disableOpenFile) {
            showSecurityMessage('Open File is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+P (Print)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 80) {
        if (disablePrintPdf) {
            showSecurityMessage('Print is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Ctrl+S (Save)
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) {
        if (disableDownload) {
            showSecurityMessage('Save is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
    
    // Disable Print Screen
    if (e.keyCode == 44) {
        if (disablePrntScrn) {
            showSecurityMessage('Print Screen is disabled!');
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }
});

// Disable Right Click
$(document).on('contextmenu', function(e) {
    if (disableRghtClck) {
        showSecurityMessage('Right Click is disabled!');
        e.preventDefault();
        e.stopImmediatePropagation();
    }
});

// Disable Text Selection
$(document).on('selectstart', function(e) {
    if (disableCopyText) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
});

// Disable Drag and Drop
$(document).on('dragstart', function(e) {
    if (disableRghtClck) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
});

// Enhanced Developer Tools Detection
let devtoolsOpen = false;
let devtoolsCheckInterval = setInterval(function() {
    const threshold = 160;
    const heightDiff = window.outerHeight - window.innerHeight;
    const widthDiff = window.outerWidth - window.innerWidth;
    
    if (heightDiff > threshold || widthDiff > threshold) {
        if (!devtoolsOpen) {
            devtoolsOpen = true;
            showSecurityMessage('Developer tools detected! PDF access may be restricted.');
            
            // Optional: Blur content when dev tools are open
            if (document.body) {
                document.body.style.filter = 'blur(3px)';
                document.body.style.userSelect = 'none';
            }
        }
    } else {
        if (devtoolsOpen) {
            devtoolsOpen = false;
            if (document.body) {
                document.body.style.filter = 'none';
                document.body.style.userSelect = disableCopyText ? 'none' : 'auto';
            }
        }
    }
}, 1000);

// Override window.print function
window.print = function() {
    if (disablePrintPdf) {
        showSecurityMessage('Printing is disabled for this document!');
        return false;
    }
};

// Block common print-related functions
if (disablePrintPdf) {
    // Override print media CSS
    const printBlockStyle = document.createElement('style');
    printBlockStyle.textContent = `
        @media print {
            * {
                display: none !important;
            }
            body::before {
                content: "Printing is not allowed for this document";
                display: block !important;
                text-align: center;
                font-size: 24px;
                color: #333;
                padding: 50px;
            }
        }
    `;
    document.head.appendChild(printBlockStyle);
}

// Disable copy to clipboard
if (disableCopyText) {
    document.addEventListener('copy', function(e) {
        e.clipboardData.setData('text/plain', '');
        e.preventDefault();
        showSecurityMessage('Copy to clipboard is disabled!');
    });
}

// Clear clipboard periodically
if (disableCopyText) {
    setInterval(function() {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText('').catch(function() {
                // Ignore errors
            });
        }
    }, 5000);
}

// Add watermark functionality
function addSecurityWatermark() {
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get('user') || 'Student';
    const timestamp = new Date().toLocaleString();
    
    const watermarkContainer = document.createElement('div');
    watermarkContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 300px,
            rgba(0, 0, 0, 0.02) 300px,
            rgba(0, 0, 0, 0.02) 350px
        );
    `;
    
    // Moving watermark
    const movingWatermark = document.createElement('div');
    movingWatermark.style.cssText = `
        position: absolute;
        color: rgba(0, 0, 0, 0.1);
        font-size: 16px;
        font-weight: bold;
        white-space: nowrap;
        animation: moveWatermark 25s linear infinite;
        transform: rotate(-20deg);
    `;
    movingWatermark.textContent = `${userEmail} - ${timestamp}`;
    
    // Static watermarks
    const topWatermark = document.createElement('div');
    topWatermark.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        color: rgba(0, 0, 0, 0.2);
        font-size: 12px;
        font-weight: bold;
        background: rgba(255, 255, 255, 0.8);
        padding: 5px 10px;
        border-radius: 3px;
    `;
    topWatermark.textContent = `${userEmail}`;
    
    const bottomWatermark = document.createElement('div');
    bottomWatermark.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        color: rgba(0, 0, 0, 0.2);
        font-size: 10px;
        background: rgba(255, 255, 255, 0.8);
        padding: 3px 8px;
        border-radius: 3px;
    `;
    bottomWatermark.textContent = `Viewed: ${timestamp}`;
    
    watermarkContainer.appendChild(movingWatermark);
    watermarkContainer.appendChild(topWatermark);
    watermarkContainer.appendChild(bottomWatermark);
    
    document.body.appendChild(watermarkContainer);
    
    // Add CSS animation
    const animationStyle = document.createElement('style');
    animationStyle.textContent = `
        @keyframes moveWatermark {
            0% { top: 10%; left: 10%; }
            25% { top: 80%; left: 80%; }
            50% { top: 40%; left: 70%; }
            75% { top: 70%; left: 20%; }
            100% { top: 10%; left: 10%; }
        }
    `;
    document.head.appendChild(animationStyle);
}

// Initialize security features when document is ready
$(document).ready(function() {
    // Add security watermark
    addSecurityWatermark();
    
    // Apply security styles
    $('body').css({
        'user-select': disableCopyText ? 'none' : 'auto',
        '-webkit-user-select': disableCopyText ? 'none' : 'auto',
        '-moz-user-select': disableCopyText ? 'none' : 'auto',
        '-ms-user-select': disableCopyText ? 'none' : 'auto'
    });
    
    console.log('PDF.js Read Only Security - Sandboxed Version Loaded');
});

// Handle beforeunload without confirmation dialog
window.addEventListener('beforeunload', function(e) {
    // Don't show confirmation dialog in sandboxed iframe
    clearInterval(devtoolsCheckInterval);
    return undefined;
});

// Handle window blur/focus for additional security
window.addEventListener('blur', function() {
    if (document.body) {
        document.body.style.filter = 'blur(2px)';
    }
});

window.addEventListener('focus', function() {
    if (document.body && !devtoolsOpen) {
        document.body.style.filter = 'none';
    }
});

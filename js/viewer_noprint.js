// PDF.js Readonly Viewer - No Print Version
// Enhanced security viewer that prevents printing and saves

(function() {
    'use strict';

    // Disable print functionality completely
    window.print = function() {
        return false;
    };

    // Override print-related functions
    if (window.PDFViewerApplication) {
        // Disable print button in PDF.js viewer
        window.PDFViewerApplication.eventBus.on('documentloaded', function() {
            const printButton = document.getElementById('print');
            if (printButton) {
                printButton.style.display = 'none';
            }
            
            const secondaryPrint = document.getElementById('secondaryPrint');
            if (secondaryPrint) {
                secondaryPrint.style.display = 'none';
            }
        });
    }

    // Block keyboard shortcuts for printing
    document.addEventListener('keydown', function(e) {
        // Block Ctrl+P (print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Block Ctrl+S (save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Block F12 (developer tools)
        if (e.key === 'F12') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Block Ctrl+Shift+I (developer tools)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        
        // Block Ctrl+U (view source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Disable drag and drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    // Monitor for CSS media print attempts
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            * {
                display: none !important;
            }
            body::before {
                content: "Printing is not allowed for this document";
                display: block !important;
                text-align: center;
                font-size: 24px;
                color: red;
                padding: 50px;
            }
        }
    `;
    document.head.appendChild(style);

    // Override window.open to prevent popup print dialogs
    const originalOpen = window.open;
    window.open = function(url, name, features) {
        // Block if it's a print-related popup
        if (url && url.includes('print') || features && features.includes('print')) {
            return null;
        }
        return originalOpen.apply(this, arguments);
    };

    // Add watermark overlay
    function addWatermark() {
        const userEmail = new URLSearchParams(window.location.search).get('user') || 'Student';
        const watermark = document.createElement('div');
        watermark.style.cssText = `
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
                transparent 200px,
                rgba(255, 0, 0, 0.02) 200px,
                rgba(255, 0, 0, 0.02) 250px
            );
        `;
        
        const movingText = document.createElement('div');
        movingText.style.cssText = `
            position: absolute;
            color: rgba(0, 0, 0, 0.1);
            font-size: 16px;
            font-weight: bold;
            animation: moveWatermark 20s linear infinite;
            transform: rotate(-25deg);
            white-space: nowrap;
        `;
        movingText.textContent = `${userEmail} - ${new Date().toLocaleString()}`;
        
        watermark.appendChild(movingText);
        document.body.appendChild(watermark);
        
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

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addWatermark);
    } else {
        addWatermark();
    }

    // Prevent beforeunload dialog in sandboxed iframe
    window.addEventListener('beforeunload', function(e) {
        // Don't show confirmation dialog in sandboxed iframe
        return undefined;
    });

    console.log('PDF.js Readonly Viewer - No Print Version Loaded');
})();

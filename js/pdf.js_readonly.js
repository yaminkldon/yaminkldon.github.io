/*  PDF.js Read Only Restriction
 *  Based on: https://github.com/latuminggi/pdf.js_readonly
 *  Modified for Firebase Education Platform
 */

// Read Only Preferences
var disableRghtClck = true; // Disable Right Click,   value: true || false
var disableCopyText = true; // Disable Copy Text,     value: true || false
var disableOpenFile = true; // Disable Open PDF,      value: true || false
var disablePrintPdf = true; // Disable Print PDF,     value: true || false
var disableDownload = true; // Disable Save PDF,      value: true || false
var disablePresents = true; // Disable Presentation,  value: true || false
var disablePrntScrn = true; // Disable Print Screen,  value: true || false (experimental)

// Load Specific viewer.js
if (disablePrintPdf) {
  $.getScript('js/viewer_noprint.js'); // Adjust path to viewer_noprint.js if necessary
} else {
  $.getScript('js/viewer.js'); // Adjust path to viewer.js if necessary
}

// Disable All Keyboard Shortcuts
$(document).keydown(function(e) {
  // Disable F12 (Developer Tools)
  if (e.keyCode == 123) {
    if (disableRghtClck) {
      alert('Developer Tools is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+Shift+I (Developer Tools)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 73) {
    if (disableRghtClck) {
      alert('Developer Tools is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+Shift+J (Console)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 74) {
    if (disableRghtClck) {
      alert('Console is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+U (View Source)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 85) {
    if (disableRghtClck) {
      alert('View Source is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+C (Copy)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 67) {
    if (disableCopyText) {
      alert('Copy is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+A (Select All)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 65) {
    if (disableCopyText) {
      alert('Select All is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+O (Open)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 79) {
    if (disableOpenFile) {
      alert('Open File is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+P (Print)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 80) {
    if (disablePrintPdf) {
      alert('Print is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Ctrl+S (Save)
  if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) {
    if (disableDownload) {
      alert('Save is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  
  // Disable Print Screen
  if (e.keyCode == 44) {
    if (disablePrntScrn) {
      alert('Print Screen is disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
});

// Stop Print Screen
function stopPrntScr() {
  var inpFld = document.createElement("input");
  inpFld.setAttribute("value", ".");
  inpFld.setAttribute("width", "0");
  inpFld.style.height = "0px";
  inpFld.style.width = "0px";
  inpFld.style.border = "0px";
  document.body.appendChild(inpFld);
  inpFld.select();
  document.execCommand("copy");
  inpFld.remove(inpFld);
}

// Clear Clipboard
function ClearClipboardData() {
  try {
    window.clipboardData.setData('text', "Access Restricted");
  } catch (err) {}
}

$(document).ready(function() {
  // Clear Print Screen Clipboard
  if (disablePrntScrn) {
    setInterval(ClearClipboardData, 300);
  }
  
  // Clear Copy Text Clipboard
  if (disableCopyText) {
    setInterval(ClearClipboardData, 300);
  }
  
  // Disable Right Click (Context Menu)
  if (disableRghtClck) {
    $('body').attr('oncontextmenu', 'return false;');
  }
  
  // Disable Open File Button
  if (disableOpenFile) {
    $('#openFile').addClass('hidden');
    $('#secondaryOpenFile').addClass('hidden');
  }
  
  // Disable Print PDF Button
  if (disablePrintPdf) {
    $('<style media="print">').text("* {display:none !important}").appendTo(document.head);
    $('#print').addClass('hidden');
    $('#secondaryPrint').addClass('hidden');
  }
  
  // Disable Download Button
  if (disableDownload) {
    $('#download').addClass('hidden');
    $('#secondaryDownload').addClass('hidden');
  }
  
  // Disable Presentation Button
  if (disablePresents) {
    $('#presentationMode').addClass('hidden');
    $('#secondaryPresentationMode').addClass('hidden');
  }
  
  // Hide custom progress when PDF loads
  setTimeout(function() {
    $('#customProgress').hide();
  }, 3000);
});

// Detect developer tools
let devtools = {
  open: false,
  orientation: null
};

const threshold = 160;

setInterval(() => {
  if (window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold) {
    if (!devtools.open) {
      devtools.open = true;
      if (disableRghtClck) {
        alert('Developer tools detected! Closing PDF for security.');
        window.location.href = 'about:blank';
      }
    }
  } else {
    devtools.open = false;
  }
}, 500);

// Disable text selection
if (disableCopyText) {
  document.addEventListener('selectstart', function(e) {
    e.preventDefault();
  });
}

// Disable drag and drop
document.addEventListener('dragstart', function(e) {
  e.preventDefault();
});

// Override print function
if (disablePrintPdf) {
  window.print = function() {
    alert('Printing is disabled for this document!');
    return false;
  };
}

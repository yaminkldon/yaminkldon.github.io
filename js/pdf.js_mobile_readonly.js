/*  PDF.js Read Only Restriction for Mobile
 *  @author: Aprillio Latuminggi
 *  @source: https://github.com/latuminggi/pdf.js_readonly
 */

// Read Only Preferences
var disableRghtClck = true; // Disable Right Click,   value: true || false
var disableCopyText = true; // Disable Copy Text,     value: true || false
var disableOpenFile = true; // Disable Open PDF,      value: true || false
var disablePrintPdf = true; // Disable Print PDF,     value: true || false
var disableDownload = true; // Disable Save PDF,      value: true || false
var disablePrntScrn = true; // Disable Print Screen,  value: true || false (experimental)

// Stop Print Screen
function stopPrntScr() {
  var inpFld = document.createElement('input');
  inpFld.setAttribute('value', '');
  inpFld.setAttribute('type', 'text');
  inpFld.setAttribute('style', 'position: absolute; left: -9999px; opacity: 0;');
  document.body.appendChild(inpFld);
  inpFld.select();
  document.execCommand('copy');
  document.body.removeChild(inpFld);
}

// Clear Clipboard
function ClearClipboardData() {
  if (window.clipboardData && clipboardData.setData) {
    clipboardData.setData('text', '');
  }
}

// Disable Print Screen Button
document.addEventListener("keyup", function (e) {
  var keyCode = e.keyCode ? e.keyCode : e.which;
  if (keyCode == 44) {
    if (disablePrntScrn) {
      stopPrntScr();
    }
  }
});

// Disable F12, Ctrl+Shift+I (Developer Tools), Ctrl+Shift+J (Console), Ctrl+U (View Source), Ctrl+S (Save), Ctrl+A (Select All), Ctrl+P (Print), Ctrl+O (Open)
document.addEventListener("keydown", function (e) {
  var keyCode = e.keyCode ? e.keyCode : e.which;
  if (keyCode == 123) {
    if (disableOpenFile) {
      alert('This function has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if (e.ctrlKey && e.shiftKey && keyCode == 73) {
    if (disableOpenFile) {
      alert('This function has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if (e.ctrlKey && e.shiftKey && keyCode == 74) {
    if (disableOpenFile) {
      alert('This function has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 85) {
    if (disableOpenFile) {
      alert('View Source has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 65) {
    if (disableCopyText) {
      alert('Select All has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 67) {
    if (disableCopyText) {
      alert('Copy Text has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 88) {
    if (disableCopyText) {
      alert('Cut Text has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 80) {
    if (disablePrintPdf) {
      alert('Print PDF has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && keyCode == 79) {
    if (disableOpenFile) {
      alert('Open PDF has been disabled!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
  if ((e.ctrlKey || e.metaKey) && (e.keyCode == 83)) {
    if (disableDownload) {
      alert('Download PDF is forbidden!');
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }
});

$(document).ready(function() {
  // Clear Print Screen Clipboard
  if (disablePrntScrn) {
    setInterval(ClearClipboardData(), 300);
  }
  // Clear Copy Text Clipboard
  if (disableCopyText) {
    setInterval(ClearClipboardData(), 300);
  }
  // Disable Right Click (Context Menu)
  if (disableRghtClck) {
    $('body').attr('oncontextmenu', 'return false;');
  }
  // Disable Header
  $('header').addClass('hidden');
  $('#viewerContainer').attr('style', 'margin-top:-50px');
});

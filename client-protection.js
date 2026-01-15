/**
 * Client-Side Security & Privacy Protection
 * 
 * Instructions:
 * 1. Include this script in your frontend application (e.g., in index.html or import in React/Vue).
 * 2. Ensure it runs on the pages where you want to protect the resume.
 */

(function() {
    'use strict';

    console.log("Initializing client-side protection...");

    // === 1. Block Inspect Element, Context Menu, Save, & Print ===

    // Disable Right Click
    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        return false;
    }, false);

    // Disable Keyboard Shortcuts
    document.addEventListener('keydown', (event) => {
        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const metaKey = event.metaKey; // Cmd on Mac
        const ctrlKey = event.ctrlKey; // Ctrl on Windows
        const altKey = event.altKey;   // Option on Mac, Alt on Windows
        const shiftKey = event.shiftKey;

        // F12 (DevTools) - Common on Windows
        if (event.key === 'F12') {
            event.preventDefault();
            return false;
        }

        // --- Common Shortcuts (Windows & Mac) ---

        // Prevent Save Page: Ctrl+S (Windows) / Cmd+S (Mac)
        if ((ctrlKey || metaKey) && (event.key === 's' || event.key === 'S')) {
            event.preventDefault();
            console.log("Saving is disabled.");
            return false;
        }

        // Prevent Print Dialog: Ctrl+P (Windows) / Cmd+P (Mac)
        if ((ctrlKey || metaKey) && (event.key === 'p' || event.key === 'P')) {
            event.preventDefault();
            console.log("Printing is disabled.");
            return false;
        }

        // --- Developer Tools & Source Code ---

        // Windows/Linux: Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspect)
        if (ctrlKey && shiftKey && 
            ['I', 'J', 'C', 'i', 'j', 'c'].includes(event.key)) {
            event.preventDefault();
            return false;
        }

        // Windows/Linux: Ctrl+U (View Source)
        if (ctrlKey && (event.key === 'u' || event.key === 'U')) {
            event.preventDefault();
            return false;
        }

        // Mac: Cmd+Option+I (DevTools), Cmd+Option+J (Console), Cmd+Option+C (Inspect)
        if (metaKey && altKey && 
            ['I', 'J', 'C', 'i', 'j', 'c'].includes(event.key)) {
            event.preventDefault();
            return false;
        }

        // Mac: Cmd+Option+U (View Source - uncommon but possible) or Cmd+U (View Source)
        if (metaKey && (event.key === 'u' || event.key === 'U')) {
            event.preventDefault();
            return false;
        }
    });

    // === 2. Detect Screenshot Attempts & Blur Content ===

    /**
     * Toggles blur on the document body.
     */
    function setPrivacyBlur(active) {
        const target = document.body;
        if (active) {
            target.style.filter = 'blur(20px)';
            target.setAttribute('data-privacy-blur', 'true');
        } else {
            target.style.filter = 'none';
            target.removeAttribute('data-privacy-blur');
        }
    }

    // Detect PrintScreen (Windows)
    document.addEventListener('keyup', (event) => {
        if (event.key === 'PrintScreen') {
            setPrivacyBlur(true);
            setTimeout(() => {
                alert('Screenshots are disabled for privacy protection.');
                setPrivacyBlur(false);
            }, 1000);
        }
    });

    // Detect Mac Screenshot Shortcuts (Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5)
    document.addEventListener('keydown', (event) => {
        if (event.metaKey && event.shiftKey && ['3', '4', '5'].includes(event.key)) {
            event.preventDefault(); // Try to prevent default OS behavior
            setPrivacyBlur(true);   // Blur immediately
            
            // Unblur after a short delay (enough time for the screenshot to take the blurred image)
            setTimeout(() => {
                setPrivacyBlur(false);
            }, 1500); 
        }
    });

    // Blur on Window Focus Loss (Handles Alt+Tab, Snipping Tool, etc.)
    window.addEventListener('blur', () => {
        setPrivacyBlur(true);
    });

    window.addEventListener('focus', () => {
        setPrivacyBlur(false);
    });

    // === 3. Disable Dragging (Prevent Drag & Drop of Images/Text) ===
    document.addEventListener('dragstart', (event) => {
        event.preventDefault();
        return false;
    });

    // === 3. Prevent Printing ===
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            body {
                display: none !important;
            }
            body::before {
                content: "Printing is disabled.";
                display: block;
                text-align: center;
                margin-top: 50px;
                font-size: 24px;
            }
        }
    `;
    document.head.appendChild(style);

})();

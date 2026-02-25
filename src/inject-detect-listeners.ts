// Runs at document_start in the content script world.
// Injects detect-listeners.js into the page's main world so it can
// monkey-patch addEventListener before any page scripts execute.

const script = document.createElement("script");
script.src = browser.runtime.getURL("dist/detect-listeners.js");
script.async = false;
(document.documentElement || document.head).appendChild(script);
script.remove();

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_start",
  main() {
    // monkey-patch injection removed – cursor:pointer heuristic used instead
  },
});

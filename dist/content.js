// src/selectors.ts
var selectors = {
  "news.ycombinator.com": [
    ".pagetop a",
    "tr.athing .titleline > a",
    "td.subtext a[href^='item?id=']",
    "a.morelink"
  ],
  "www.reddit.com": [
    "header a[href]",
    "aside a[href^='/r/']",
    "shreddit-post a[slot='title']",
    "shreddit-post a[slot='full-post-link']",
    "shreddit-post a[href*='/comments/']"
  ],
  "lobste.rs": [
    "header#nav .links a",
    "header#nav .corner a",
    "ol.stories .u-url",
    "ol.stories .comments_label a",
    "#inside a.morelink, #inside a[href^='/t/']"
  ],
  "slashdot.org": [
    "header a[href], nav a[href]",
    ".story-title a",
    ".comment-top a",
    "#slashboxes a"
  ],
  "github.com": [
    "header a.HeaderMenu-link, header a[data-hotkey], header button, header summary",
    "nav.UnderlineNav-body a.UnderlineNav-item[data-pjax], nav[aria-label='Repository'] a[data-pjax]",
    ".Layout-sidebar a[href], aside a[href]",
    "#repo-content-pjax-container a.react-directory-filename-column, #repo-content-pjax-container a[href*='/tree/'], #repo-content-pjax-container a[href*='/blob/'], #repo-content-pjax-container article a[href]",
    ".paginate-container a, .BtnGroup a, .subnav a"
  ],
  "gitlab.com": [
    "header a[href], .top-bar a[href]",
    ".nav-sidebar a[href], .super-sidebar a[href]",
    ".tree-item a.tree-item-link, .commit-row-message a, .merge-request-title a",
    ".gl-pagination a, .gl-tab-nav a, .breadcrumbs a"
  ],
  "stackoverflow.com": [
    "header a[href]",
    ".left-sidebar a[href]",
    ".s-post-summary--content-title a, .question-hyperlink, .answer-hyperlink",
    ".comment-copy a, .s-pagination a, .s-navigation a"
  ],
  "www.npmjs.com": [
    "header a[href], nav a[href]",
    "main a[href^='/package/'], main a[href^='/~']",
    ".tabs a, [role='tablist'] a"
  ],
  "crates.io": [
    "header a[href], nav a[href]",
    "main a[href^='/crates/'], main a[href*='/users/']",
    ".pagination a"
  ],
  "pypi.org": [
    "header a[href], .horizontal-menu a",
    ".sidebar-section a",
    "main a[href^='/project/'], main a[href^='/user/']"
  ],
  "www.google.com": [
    "#gb a[href], header a[href]",
    "#search a:has(h3), #search a[href]:not([href^='#']):not([href^='javascript'])",
    "#foot a, #botstuff a"
  ],
  "duckduckgo.com": [
    "header a[href], .header--aside a[href], .nav-link",
    "a[data-testid='result-title-a'], .results a[href]",
    ".pagination a, footer a[href]"
  ],
  "search.brave.com": [
    "header a[href], nav a[href]",
    ".heading-serpresult a, .snippet a[href]",
    ".pagination a"
  ],
  "twitter.com": [
    "nav a[href]",
    "main article a[href*='/status/'], main article a[href^='/'][role='link']",
    "aside a[href]"
  ],
  "x.com": [
    "nav a[href]",
    "main article a[href*='/status/'], main article a[href^='/'][role='link']",
    "aside a[href]"
  ],
  "mastodon.social": [
    ".column-header a, nav a[href]",
    ".status__content a, .status a.status__relative-time, .display-name a",
    ".drawer a[href], .column-link"
  ],
  "www.linkedin.com": [
    "header .global-nav__primary-link, header a[href]",
    "aside a[href]",
    ".feed-shared-update-v2 a[href], .scaffold-layout__main a[href]"
  ],
  "web.whatsapp.com": [
    "#pane-side a[href], #pane-side [role='button']",
    "#main a[href], #main [role='button'], #main [contenteditable='true']",
    "header a[href], header [role='button']",
    ".landing-window a.browser-title, .landing-window a.image"
  ],
  "web.telegram.org": [
    ".page_wrap .sidebar a[href], .page_wrap .im_dialogs_col a[href]",
    ".page_wrap .im_history a[href], .page_wrap .im_send_panel [contenteditable='true']",
    ".page_wrap header a[href], .page_wrap button, .page_wrap [role='button']"
  ],
  "app.slack.com": [
    "#client-ui nav a[href], #client-ui [data-qa='channel_sidebar_name']",
    "#client-ui main a[href], #client-ui [role='button'], #client-ui button",
    "nav.top a, .mobile_menu a, #page a, footer a"
  ],
  "www.youtube.com": [
    "ytd-masthead a[href], ytd-guide-entry-renderer a",
    "a#video-title-link, a#video-title, ytd-rich-item-renderer a#thumbnail",
    "tp-yt-paper-tab a, #tabsContent a"
  ],
  "www.twitch.tv": [
    ".side-nav a[href], .side-nav-card a",
    "a[data-a-target='preview-card-title-link'], main a[href*='/videos/'], main a[href*='/clip/']",
    "header a[href], header button"
  ],
  "open.spotify.com": [
    "nav[aria-label] a[href], [data-testid='left-sidebar'] a[href]",
    "main a[href^='/track/'], main a[href^='/album/'], main a[href^='/playlist/'], main a[href^='/artist/']",
    "header a[href], header button"
  ],
  "en.wikipedia.org": [
    "#mw-head a[href], #p-navigation a, #p-search a[href]",
    "#mw-panel a[href]",
    "#mw-content-text a[href^='/wiki/'], .mw-editsection a"
  ],
  "developer.mozilla.org": [
    "header a[href], nav a[href]",
    ".sidebar a[href]",
    ".main-page-content a[href], main a[href]"
  ],
  "docs.github.com": [
    "header a[href], nav a[href]",
    ".sidebar a[href]",
    "article a[href], main a[href]"
  ],
  "mail.google.com": [
    "div[role='navigation'] a, .aim a[href]",
    "table[role='grid'] tr.zA td.xY a.yW, table[role='grid'] tr.zA a[href]",
    "div[role='main'] a[href], div[role='main'] [role='button']"
  ],
  "calendar.google.com": [
    "nav a[href], [role='navigation'] a[href]",
    "[data-eventid], .d6McF a, [role='grid'] a[href]",
    "[role='dialog'] a[href], [role='dialog'] button"
  ],
  "trello.com": [
    ".board-header a[href], .board-header-btn",
    ".board-menu-navigation a, .board-sidebar a[href]",
    ".list-card a, .list-card-details a[href]"
  ],
  "notion.so": [
    ".notion-sidebar a, [aria-label='Sidebar'] a",
    ".notion-page-content a[href], main a[href]",
    ".notion-table-of-contents a"
  ],
  "www.amazon.com": [
    "#nav-main a[href], #nav-xshop a",
    "#departments a[href], #s-refinements a[href]",
    ".s-result-item h2 a, main a[href*='/dp/']",
    ".a-pagination a"
  ],
  "www.ebay.com": [
    "#gh-top-nav a, #gh a[href]",
    ".x-refine__main a[href], .srp-refine__category__list a[href]",
    ".s-item__link",
    ".pagination a"
  ],
  "www.imdb.com": [
    "header a[href], nav a[href]",
    ".ipc-sub-grid a, aside a[href]",
    ".ipc-title-link-wrapper, .ipc-metadata-list a"
  ],
  "medium.com": [
    "header a[href], nav a[href]",
    "article a[href], .postArticle-readMore a",
    "aside a[href], footer a[href]"
  ],
  "www.nytimes.com": [
    "header nav a[href], header a[href]",
    "main article a[href], .story-wrapper a",
    "aside a[href], footer a[href]"
  ],
  "www.theguardian.com": [
    "header nav a[href], .subnav-link",
    ".fc-item__link, main article a[href]",
    "footer a[href], aside a[href]"
  ],
  "arstechnica.com": [
    "header nav a[href], nav a[href]",
    ".sidebar a[href], aside a[href]",
    ".listing h2 a, article a[href]"
  ]
};

// src/hints.ts
var ALPHABET = "asdfghjkl";
function generateLabels(count) {
  const k = ALPHABET.length;
  const labels = [];
  for (let i = 0;i < count; i++) {
    labels.push(ALPHABET[i % k]);
  }
  return labels;
}
var HINT_STYLE = {
  position: "absolute",
  zIndex: "2147483647",
  padding: "1px 4px",
  background: "#f5c518",
  color: "#000",
  fontSize: "11px",
  fontFamily: "monospace",
  fontWeight: "bold",
  lineHeight: "1.2",
  borderRadius: "2px",
  border: "1px solid #c9a100",
  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  pointerEvents: "none"
};
var HIGHLIGHT_STYLE = {
  position: "absolute",
  zIndex: "2147483646",
  pointerEvents: "none",
  border: "2px solid #f5c518",
  borderRadius: "4px",
  background: "rgba(245, 197, 24, 0.08)"
};
var GAP = 0;
var ESTIMATED_CHAR_WIDTH = 7.5;
var ESTIMATED_HEIGHT = 16;
function estimateHintSize(label) {
  return {
    w: label.length * ESTIMATED_CHAR_WIDTH + 10,
    h: ESTIMATED_HEIGHT
  };
}
function pickGravity(rect, hintW, hintH) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fitsRight = vw - rect.right >= hintW + GAP;
  const fitsLeft = rect.left >= hintW + GAP;
  const fitsTop = rect.top >= hintH + GAP;
  const fitsBottom = vh - rect.bottom >= hintH + GAP;
  if (fitsBottom)
    return "bottom";
  if (fitsTop)
    return "top";
  if (fitsTop && fitsRight)
    return "top-right";
  if (fitsTop && fitsLeft)
    return "top-left";
  if (fitsBottom && fitsRight)
    return "bottom-right";
  if (fitsBottom && fitsLeft)
    return "bottom-left";
  return "bottom";
}
function positionForGravity(gravity, rect, hintW, hintH) {
  const centerX = rect.left + (rect.width - hintW) / 2;
  switch (gravity) {
    case "bottom":
      return { left: centerX, top: rect.bottom + GAP };
    case "top":
      return { left: centerX, top: rect.top - hintH - GAP };
    case "top-right":
      return { left: rect.right + GAP, top: rect.top - hintH - GAP };
    case "top-left":
      return { left: rect.left - hintW - GAP, top: rect.top - hintH - GAP };
    case "bottom-right":
      return { left: rect.right + GAP, top: rect.bottom + GAP };
    case "bottom-left":
      return { left: rect.left - hintW - GAP, top: rect.bottom + GAP };
  }
}
function clamp(pos, hintW, hintH) {
  return {
    left: Math.max(0, Math.min(pos.left, window.innerWidth - hintW)),
    top: Math.max(0, Math.min(pos.top, window.innerHeight - hintH))
  };
}
function rectIntersectsViewport(rect) {
  return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
}
function clipRectToViewport(rect) {
  const left = Math.max(0, rect.left);
  const top = Math.max(0, rect.top);
  const right = Math.min(window.innerWidth, rect.right);
  const bottom = Math.min(window.innerHeight, rect.bottom);
  return new DOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}
function createHintElement(label, rect) {
  const hint = document.createElement("div");
  hint.textContent = label;
  hint.dataset.hint = label;
  const { w, h } = estimateHintSize(label);
  const gravity = pickGravity(rect, w, h);
  const pos = clamp(positionForGravity(gravity, rect, w, h), w, h);
  Object.assign(hint.style, {
    ...HINT_STYLE,
    left: `${pos.left + window.scrollX}px`,
    top: `${pos.top + window.scrollY}px`
  });
  return hint;
}
function createHighlightElement(rect) {
  const el = document.createElement("div");
  Object.assign(el.style, {
    ...HIGHLIGHT_STYLE,
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.top + window.scrollY}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`
  });
  return el;
}
function findCommonAncestor(elements) {
  if (elements.length === 1)
    return elements[0];
  let ancestor = elements[0];
  for (let i = 1;i < elements.length; i++) {
    while (!ancestor.contains(elements[i])) {
      ancestor = ancestor.parentElement ?? document.documentElement;
    }
  }
  return ancestor;
}
function boundingRect(elements) {
  let top = Infinity;
  let left = Infinity;
  let bottom = -Infinity;
  let right = -Infinity;
  for (const el of elements) {
    const r = el.getBoundingClientRect();
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    bottom = Math.max(bottom, r.bottom);
    right = Math.max(right, r.right);
  }
  return new DOMRect(left, top, right - left, bottom - top);
}
function isVisible(el) {
  const style = getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }
  const rect = el.getBoundingClientRect();
  return rectIntersectsViewport(rect);
}
var managedElements = [];
function addManaged(el) {
  document.documentElement.appendChild(el);
  managedElements.push(el);
}
function showHints(selectorGroups) {
  const hints = [];
  const groupsWithElements = [];
  const seenElements = new Set;
  for (let g = 0;g < selectorGroups.length; g++) {
    const elements = Array.from(document.querySelectorAll(selectorGroups[g])).filter((element) => {
      if (!isVisible(element))
        return false;
      if (seenElements.has(element))
        return false;
      seenElements.add(element);
      return true;
    });
    if (elements.length > 0) {
      groupsWithElements.push({ group: g, elements });
    }
  }
  const singleGroup = groupsWithElements.length === 1;
  if (singleGroup) {
    const { group, elements } = groupsWithElements[0];
    const labels = generateLabels(elements.length);
    for (let i = 0;i < elements.length; i++) {
      const rect = elements[i].getBoundingClientRect();
      const overlay = createHintElement(labels[i], rect);
      addManaged(overlay);
      hints.push({ group, label: labels[i], element: elements[i], overlay });
    }
  } else {
    const groupLabels = generateLabels(groupsWithElements.length);
    for (let gi = 0;gi < groupsWithElements.length; gi++) {
      const { group, elements } = groupsWithElements[gi];
      const container = findCommonAncestor(elements);
      const rawContainerRect = container === document.documentElement ? boundingRect(elements) : container.getBoundingClientRect();
      const containerRect = clipRectToViewport(rawContainerRect);
      if (!rectIntersectsViewport(containerRect))
        continue;
      const highlight = createHighlightElement(containerRect);
      addManaged(highlight);
      const hintOverlay = createHintElement(groupLabels[gi], containerRect);
      addManaged(hintOverlay);
      for (const element of elements) {
        hints.push({
          group,
          label: groupLabels[gi],
          element,
          overlay: hintOverlay
        });
      }
    }
  }
  return hints;
}
function relabelHints(hints) {
  for (const el of managedElements) {
    el.remove();
  }
  managedElements.length = 0;
  const visible = hints.filter((h) => h.overlay.style.display !== "none");
  const labels = generateLabels(visible.length);
  for (let i = 0;i < visible.length; i++) {
    const rect = visible[i].element.getBoundingClientRect();
    const overlay = createHintElement(labels[i], rect);
    addManaged(overlay);
    visible[i].label = labels[i];
    visible[i].overlay = overlay;
  }
}
function removeHints(_hints) {
  for (const el of managedElements) {
    el.remove();
  }
  managedElements.length = 0;
}

// src/content.ts
var domain = window.location.hostname;
var domainSelectors = selectors[domain];
if (domainSelectors) {
  let activate = function() {
    hints = showHints(domainSelectors);
    if (hints.length === 0)
      return;
    active = true;
  }, deactivate = function() {
    removeHints(hints);
    hints = [];
    active = false;
  }, handleKey = function(key) {
    const visible = hints.filter((h) => h.overlay.style.display !== "none");
    const matched = visible.filter((h) => h.label === key);
    if (matched.length === 1) {
      const target = matched[0].element;
      deactivate();
      target.focus();
      target.click();
      return;
    }
    const matchedGroups = new Set(matched.map((h) => h.group));
    if (matched.length > 1 && matchedGroups.size === 1) {
      matched[0].element.scrollIntoView({ block: "center", inline: "nearest" });
    }
    for (const hint of visible) {
      if (hint.label !== key) {
        hint.overlay.style.display = "none";
      }
    }
    relabelHints(hints);
  };
  let active = false;
  let hints = [];
  document.addEventListener("keydown", (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLElement && e.target.isContentEditable) {
      return;
    }
    if (e.key === "j" && e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (active) {
        deactivate();
      } else {
        activate();
      }
      return;
    }
    if (!active)
      return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopImmediatePropagation();
      deactivate();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handleKey(e.key.toLowerCase());
    }
  }, true);
}

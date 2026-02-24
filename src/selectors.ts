export const selectors: Record<string, string[]> = {
  "news.ycombinator.com": [
    // Header
    ".pagetop a",
    // Main list
    "tr.athing .titleline > a",
    "td.subtext a[href^='item?id=']",
    // Pagination
    "a.morelink",
  ],

  "www.reddit.com": [
    // Header / top nav
    "header a[href]",
    // Sidebar / community nav
    "aside a[href^='/r/']",
    // Main feed
    "shreddit-post a[slot='title']",
    "shreddit-post a[slot='full-post-link']",
    // Post actions / comments links
    "shreddit-post a[href*='/comments/']",
  ],

  "lobste.rs": [
    // Header nav
    "header#nav .links a",
    "header#nav .corner a",
    // Story list (main)
    "ol.stories .u-url",
    "ol.stories .comments_label a",
    // Footer / extras
    "#inside a.morelink, #inside a[href^='/t/']",
  ],

  "slashdot.org": [
    // Header / nav
    "header a[href], nav a[href]",
    // Main stories
    ".story-title a",
    // Comment / meta links
    ".comment-top a",
    // Sidebar blocks
    "#slashboxes a",
  ],

  "github.com": [
    // Header / global nav
    "header a.HeaderMenu-link, header a[data-hotkey], header button, header summary",
    // Repo subnavigation
    "nav.UnderlineNav-body a.UnderlineNav-item[data-pjax], nav[aria-label='Repository'] a[data-pjax]",
    // Sidebar
    ".Layout-sidebar a[href], aside a[href]",
    // Main content (files, docs, timeline links)
    "#repo-content-pjax-container a.react-directory-filename-column, #repo-content-pjax-container a[href*='/tree/'], #repo-content-pjax-container a[href*='/blob/'], #repo-content-pjax-container article a[href]",
    // Secondary controls
    ".paginate-container a, .BtnGroup a, .subnav a",
  ],

  "gitlab.com": [
    // Header / project top nav
    "header a[href], .top-bar a[href]",
    // Left sidebar
    ".nav-sidebar a[href], .super-sidebar a[href]",
    // Main content lists
    ".tree-item a.tree-item-link, .commit-row-message a, .merge-request-title a",
    // Subnav / pagination
    ".gl-pagination a, .gl-tab-nav a, .breadcrumbs a",
  ],

  "stackoverflow.com": [
    // Header
    "header a[href]",
    // Left sidebar
    ".left-sidebar a[href]",
    // Main question list/content
    ".s-post-summary--content-title a, .question-hyperlink, .answer-hyperlink",
    // Meta / comments / pagination
    ".comment-copy a, .s-pagination a, .s-navigation a",
  ],

  "www.npmjs.com": [
    // Header
    "header a[href], nav a[href]",
    // Main package/search content
    "main a[href^='/package/'], main a[href^='/~']",
    // Tabs / secondary nav
    ".tabs a, [role='tablist'] a",
  ],

  "crates.io": [
    // Header / nav
    "header a[href], nav a[href]",
    // Main content
    "main a[href^='/crates/'], main a[href*='/users/']",
    // Pagination / controls
    ".pagination a",
  ],

  "pypi.org": [
    // Header nav
    "header a[href], .horizontal-menu a",
    // Sidebar
    ".sidebar-section a",
    // Main packages/content
    "main a[href^='/project/'], main a[href^='/user/']",
  ],

  "www.google.com": [
    // Header / top nav
    "#gb a[href], header a[href]",
    // Main search results
    "#search a:has(h3), #search a[href]:not([href^='#']):not([href^='javascript'])",
    // Footer / pagination
    "#foot a, #botstuff a",
  ],

  "duckduckgo.com": [
    // Header / top nav
    "header a[href], .header--aside a[href], .nav-link",
    // Main results
    "a[data-testid='result-title-a'], .results a[href]",
    // Bottom nav
    ".pagination a, footer a[href]",
  ],

  "search.brave.com": [
    // Header / search controls
    "header a[href], nav a[href]",
    // Main results
    ".heading-serpresult a, .snippet a[href]",
    // Pagination
    ".pagination a",
  ],

  "twitter.com": [
    // Primary nav
    "nav a[href]",
    // Main timeline/profile links
    "main article a[href*='/status/'], main article a[href^='/'][role='link']",
    // Side panels
    "aside a[href]",
  ],

  "x.com": [
    // Primary nav
    "nav a[href]",
    // Main timeline/profile links
    "main article a[href*='/status/'], main article a[href^='/'][role='link']",
    // Side panels
    "aside a[href]",
  ],

  "mastodon.social": [
    // Column headers/nav
    ".column-header a, nav a[href]",
    // Main statuses
    ".status__content a, .status a.status__relative-time, .display-name a",
    // Sidebars
    ".drawer a[href], .column-link",
  ],

  "www.linkedin.com": [
    // Global nav
    "header .global-nav__primary-link, header a[href]",
    // Sidebar modules
    "aside a[href]",
    // Main feed/content
    ".feed-shared-update-v2 a[href], .scaffold-layout__main a[href]",
  ],

  "web.whatsapp.com": [
    // Side/chat list region
    "#pane-side a[href], #pane-side [role='button']",
    // Main chat region
    "#main a[href], #main [role='button'], #main [contenteditable='true']",
    // Header / app controls
    "header a[href], header [role='button']",
    // Login/unsupported landing
    ".landing-window a.browser-title, .landing-window a.image",
  ],

  "web.telegram.org": [
    // Left pane/dialog list
    ".page_wrap .sidebar a[href], .page_wrap .im_dialogs_col a[href]",
    // Main message pane
    ".page_wrap .im_history a[href], .page_wrap .im_send_panel [contenteditable='true']",
    // Header / controls
    ".page_wrap header a[href], .page_wrap button, .page_wrap [role='button']",
  ],

  "app.slack.com": [
    // Left sidebar + channel list
    "#client-ui nav a[href], #client-ui [data-qa='channel_sidebar_name']",
    // Main message/content area
    "#client-ui main a[href], #client-ui [role='button'], #client-ui button",
    // Fallback top nav / non-app shell
    "nav.top a, .mobile_menu a, #page a, footer a",
  ],

  "www.youtube.com": [
    // Top nav + guide
    "ytd-masthead a[href], ytd-guide-entry-renderer a",
    // Main feed/watch links
    "a#video-title-link, a#video-title, ytd-rich-item-renderer a#thumbnail",
    // Tabs/subnavigation
    "tp-yt-paper-tab a, #tabsContent a",
  ],

  "www.twitch.tv": [
    // Left nav / followed channels
    ".side-nav a[href], .side-nav-card a",
    // Main content cards
    "a[data-a-target='preview-card-title-link'], main a[href*='/videos/'], main a[href*='/clip/']",
    // Top nav
    "header a[href], header button",
  ],

  "open.spotify.com": [
    // Sidebar nav
    "nav[aria-label] a[href], [data-testid='left-sidebar'] a[href]",
    // Main content items
    "main a[href^='/track/'], main a[href^='/album/'], main a[href^='/playlist/'], main a[href^='/artist/']",
    // Top bar controls
    "header a[href], header button",
  ],

  "en.wikipedia.org": [
    // Header / site nav
    "#mw-head a[href], #p-navigation a, #p-search a[href]",
    // Sidebar
    "#mw-panel a[href]",
    // Main article
    "#mw-content-text a[href^='/wiki/'], .mw-editsection a",
  ],

  "developer.mozilla.org": [
    // Header / nav
    "header a[href], nav a[href]",
    // Sidebar
    ".sidebar a[href]",
    // Main docs content
    ".main-page-content a[href], main a[href]",
  ],

  "docs.github.com": [
    // Header
    "header a[href], nav a[href]",
    // Sidebar
    ".sidebar a[href]",
    // Main docs article
    "article a[href], main a[href]",
  ],

  "mail.google.com": [
    // Left nav/sidebar
    "div[role='navigation'] a, .aim a[href]",
    // Main thread list
    "table[role='grid'] tr.zA td.xY a.yW, table[role='grid'] tr.zA a[href]",
    // Message view/actions
    "div[role='main'] a[href], div[role='main'] [role='button']",
  ],

  "calendar.google.com": [
    // Left/sidebar + top nav
    "nav a[href], [role='navigation'] a[href]",
    // Calendar grid/events
    "[data-eventid], .d6McF a, [role='grid'] a[href]",
    // Dialog/actions
    "[role='dialog'] a[href], [role='dialog'] button",
  ],

  "trello.com": [
    // Board header/nav
    ".board-header a[href], .board-header-btn",
    // Left/menu/sidebar
    ".board-menu-navigation a, .board-sidebar a[href]",
    // Main cards/lists
    ".list-card a, .list-card-details a[href]",
  ],

  "notion.so": [
    // Sidebar
    ".notion-sidebar a, [aria-label='Sidebar'] a",
    // Main page content
    ".notion-page-content a[href], main a[href]",
    // In-page navigation
    ".notion-table-of-contents a",
  ],

  "www.amazon.com": [
    // Header / top nav
    "#nav-main a[href], #nav-xshop a",
    // Sidebar/filters
    "#departments a[href], #s-refinements a[href]",
    // Main results/content
    ".s-result-item h2 a, main a[href*='/dp/']",
    // Pagination
    ".a-pagination a",
  ],

  "www.ebay.com": [
    // Header nav
    "#gh-top-nav a, #gh a[href]",
    // Sidebar/filters
    ".x-refine__main a[href], .srp-refine__category__list a[href]",
    // Main results
    ".s-item__link",
    // Pagination
    ".pagination a",
  ],

  "www.imdb.com": [
    // Header / nav
    "header a[href], nav a[href]",
    // Sidebar/secondary content
    ".ipc-sub-grid a, aside a[href]",
    // Main content lists/cards
    ".ipc-title-link-wrapper, .ipc-metadata-list a",
  ],

  "medium.com": [
    // Header nav
    "header a[href], nav a[href]",
    // Main feed/article area
    "article a[href], .postArticle-readMore a",
    // Sidebar/footer
    "aside a[href], footer a[href]",
  ],

  "www.nytimes.com": [
    // Header / section nav
    "header nav a[href], header a[href]",
    // Main story stream
    "main article a[href], .story-wrapper a",
    // Secondary/sidebar/footer
    "aside a[href], footer a[href]",
  ],

  "www.theguardian.com": [
    // Header / subnav
    "header nav a[href], .subnav-link",
    // Main feed
    ".fc-item__link, main article a[href]",
    // Footer / secondary
    "footer a[href], aside a[href]",
  ],

  "arstechnica.com": [
    // Header / nav
    "header nav a[href], nav a[href]",
    // Sidebar
    ".sidebar a[href], aside a[href]",
    // Main listings/articles
    ".listing h2 a, article a[href]",
  ],
};

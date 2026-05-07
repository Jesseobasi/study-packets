(function () {
  const dashboardData = window.STUDY_DASHBOARD_DATA;

  if (!dashboardData) {
    return;
  }

  const { site, packets, overviewThemes, studySet } = dashboardData;

  const elements = {
    siteBadge: document.getElementById("site-badge"),
    siteTitle: document.getElementById("site-title"),
    siteDescription: document.getElementById("site-description"),
    setTermCount: document.getElementById("set-term-count"),
    packetCountInline: document.getElementById("packet-count-inline"),
    snapshotTitle: document.getElementById("snapshot-title"),
    packetCountBadge: document.getElementById("packet-count-badge"),
    packetGrid: document.getElementById("packet-grid"),
    topicMap: document.getElementById("topic-map"),
    overviewBadge: document.getElementById("overview-badge"),
    overviewSections: document.getElementById("overview-sections"),
    modeTabs: Array.from(document.querySelectorAll("[data-mode-target]")),
    modePanels: Array.from(document.querySelectorAll(".mode-panel")),
    heroStartQuiz: document.getElementById("hero-start-quiz"),
    heroReviewCards: document.getElementById("hero-review-cards"),
    heroOpenList: document.getElementById("hero-open-list"),
    themeToggle: document.getElementById("theme-toggle"),
    statTotal: document.getElementById("stat-total"),
    statCard: document.getElementById("stat-card"),
    statScore: document.getElementById("stat-score"),
    flashcard: document.getElementById("flashcard"),
    flashcardInner: document.getElementById("flashcard-inner"),
    flashcardCounter: document.getElementById("flashcard-counter"),
    flashcardTerm: document.getElementById("flashcard-term"),
    flashcardDef: document.getElementById("flashcard-def"),
    flashcardFamily: document.getElementById("flashcard-family"),
    flashcardSubtopic: document.getElementById("flashcard-subtopic"),
    prevCard: document.getElementById("prev-card"),
    nextCard: document.getElementById("next-card"),
    flipCard: document.getElementById("flip-card"),
    conceptVisual: document.getElementById("concept-visual"),
    visualBadge: document.getElementById("visual-badge"),
    visualCaption: document.getElementById("visual-caption"),
    quizProgress: document.getElementById("quiz-progress"),
    quizTerm: document.getElementById("quiz-term"),
    quizOptions: document.getElementById("quiz-options"),
    quizFeedback: document.getElementById("quiz-feedback"),
    nextQuestion: document.getElementById("next-question"),
    restartQuiz: document.getElementById("restart-quiz"),
    quizScoreLive: document.getElementById("quiz-score-live"),
    quizAnsweredLive: document.getElementById("quiz-answered-live"),
    quizRemainingLive: document.getElementById("quiz-remaining-live"),
    quizConceptVisual: document.getElementById("quiz-concept-visual"),
    quizVisualCaption: document.getElementById("quiz-visual-caption"),
    searchInput: document.getElementById("search-input"),
    clearSearch: document.getElementById("clear-search"),
    resultsCount: document.getElementById("results-count"),
    termList: document.getElementById("term-list")
  };

  const state = {
    mode: "flashcards",
    flashcardIndex: 0,
    flipped: false,
    quizOrder: [],
    quizPointer: 0,
    quizScore: 0,
    searchTerm: "",
    darkMode: false
  };

  const themeStorageKey = "study-template-theme";
  const coolFamilies = new Set([
    "Internet Fundamentals",
    "Web Foundations",
    "Transport and Reliability"
  ]);

  function shuffle(array) {
    const result = [...array];

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }

    return result;
  }

  function getCategory(item) {
    return { family: item.family, topic: item.topic };
  }

  function getFamilyTone(family) {
    return coolFamilies.has(family) ? "cool" : "warm";
  }

  function getInitialTheme() {
    try {
      const savedTheme = localStorage.getItem(themeStorageKey);

      if (savedTheme === "dark") {
        return true;
      }

      if (savedTheme === "light") {
        return false;
      }
    } catch (error) {
      // Ignore storage access issues.
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function updateThemeToggle() {
    elements.themeToggle.classList.toggle("is-dark", state.darkMode);
    elements.themeToggle.setAttribute("aria-pressed", String(state.darkMode));
    elements.themeToggle.setAttribute("aria-label", state.darkMode ? "Switch to light mode" : "Switch to dark mode");
  }

  function applyTheme(isDark) {
    state.darkMode = isDark;
    document.body.classList.toggle("dark-mode", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    updateThemeToggle();

    try {
      localStorage.setItem(themeStorageKey, isDark ? "dark" : "light");
    } catch (error) {
      // Ignore persistence failures.
    }
  }

  function setNextQuestionEnabled(isEnabled) {
    elements.nextQuestion.disabled = !isEnabled;
    elements.nextQuestion.classList.toggle("is-disabled", !isEnabled);
  }

  function updateStats() {
    const answered = state.quizPointer;
    const accuracy = answered === 0 ? 0 : Math.round((state.quizScore / answered) * 100);

    elements.statTotal.textContent = String(studySet.length);
    elements.statCard.textContent = studySet.length ? `${state.flashcardIndex + 1} / ${studySet.length}` : "0 / 0";
    elements.statScore.textContent = `${accuracy}%`;
    elements.quizScoreLive.textContent = String(state.quizScore);
    elements.quizAnsweredLive.textContent = String(answered);
    elements.quizRemainingLive.textContent = String(Math.max(studySet.length - answered, 0));
  }

  function renderHeroContent() {
    elements.siteBadge.textContent = site.badge;
    elements.siteTitle.textContent = site.title;
    elements.siteDescription.textContent = site.description;
    elements.setTermCount.textContent = String(studySet.length);
    elements.packetCountInline.textContent = String(packets.length);
    elements.snapshotTitle.textContent = site.snapshotTitle;
    elements.packetCountBadge.textContent = `${packets.length} PDFs`;
    elements.overviewBadge.textContent = site.overviewBadge;

    elements.packetGrid.innerHTML = packets.length
      ? packets.map((packet) => `
        <a href="${packet.href}" class="packet-link" data-accent="${packet.accent}">
          <p class="packet-label">${packet.packet}</p>
          <p class="packet-title">${packet.title}</p>
        </a>
      `).join("")
      : `
        <article class="packet-link" data-accent="cool">
          <p class="packet-label">No packets yet</p>
          <p class="packet-title">Add packet objects in <code>assets/js/data.js</code></p>
        </article>
      `;

    elements.topicMap.innerHTML = site.topicMap.length
      ? site.topicMap.map((entry) => `<p>${entry}</p>`).join("")
      : "<p>Add topic groups here.</p>";
  }

  function renderOverviewThemes() {
    if (!overviewThemes.length) {
      elements.overviewSections.innerHTML = `
        <article class="topic-card" data-accent="cool">
          <div class="topic-card-head">
            <div>
              <p class="section-eyebrow">No themes yet</p>
              <h3 class="topic-card-title">Create your own overview sections</h3>
            </div>
            <div class="info-pill info-pill-cool">Template</div>
          </div>
          <div class="topic-card-grid">
            <div class="topic-card-grid-item">
              <h4>Add section titles</h4>
              <p>Use <code>overviewThemes</code> in <code>assets/js/data.js</code> to group major ideas, units, or exam sections.</p>
            </div>
            <div class="topic-card-grid-item">
              <h4>Add summary bullets</h4>
              <p>Each section can contain short study reminders, key skills, or chapter breakdowns.</p>
            </div>
          </div>
        </article>
      `;
      return;
    }

    elements.overviewSections.innerHTML = overviewThemes.map((theme) => `
      <article class="topic-card" data-accent="${theme.accent}">
        <div class="topic-card-head">
          <div>
            <p class="section-eyebrow ${theme.accent === "warm" ? "section-eyebrow-warm" : ""}">${theme.chapterLabel}</p>
            <h3 class="topic-card-title">${theme.title}</h3>
          </div>
          <div class="info-pill ${theme.accent === "cool" ? "info-pill-cool" : ""}">${theme.badge}</div>
        </div>
        <div class="topic-card-grid">
          ${theme.items.map((item) => `
            <div class="topic-card-grid-item">
              <h4>${item.label}</h4>
              <p>${item.description}</p>
            </div>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  function buildVisualMarkup(item) {
    const visual = item.visual;

    if (visual === "stack") {
      return `
        <rect x="76" y="30" width="168" height="34" rx="12" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="76" y="72" width="168" height="34" rx="12" fill="#e0ecff" stroke="#0d47a1" stroke-width="2"/>
        <rect x="76" y="114" width="168" height="34" rx="12" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <rect x="76" y="156" width="168" height="34" rx="12" fill="#ffedd5" stroke="#f28c28" stroke-width="2"/>
        <rect x="76" y="198" width="168" height="34" rx="12" fill="#fef3c7" stroke="#d97706" stroke-width="2"/>
        <text x="160" y="52" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Application</text>
        <text x="160" y="94" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Transport</text>
        <text x="160" y="136" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Network</text>
        <text x="160" y="178" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Link</text>
        <text x="160" y="220" text-anchor="middle" fill="#92400e" font-size="13" font-weight="700">Physical</text>
      `;
    }

    if (visual === "delay") {
      return `
        <rect x="18" y="98" width="284" height="34" rx="17" fill="#e2e8f0"/>
        <rect x="28" y="104" width="48" height="22" rx="11" fill="#dbeafe"/>
        <rect x="86" y="104" width="72" height="22" rx="11" fill="#bfdbfe"/>
        <rect x="168" y="104" width="66" height="22" rx="11" fill="#fde68a"/>
        <rect x="244" y="104" width="48" height="22" rx="11" fill="#fdba74"/>
        <text x="52" y="85" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Processing</text>
        <text x="122" y="85" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Queue</text>
        <text x="201" y="85" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700">Transmit</text>
        <text x="268" y="85" text-anchor="middle" fill="#92400e" font-size="12" font-weight="700">Propagate</text>
        <path d="M36 154 L286 154" stroke="#0d47a1" stroke-width="3"/>
        <circle cx="56" cy="154" r="8" fill="#0d47a1"/>
        <circle cx="146" cy="154" r="8" fill="#2563eb"/>
        <circle cx="236" cy="154" r="8" fill="#f28c28"/>
        <text x="160" y="196" text-anchor="middle" fill="#64748b" font-size="12">RTT and throughput depend on the path and the slowest stage.</text>
      `;
    }

    if (visual === "dns") {
      return `
        <rect x="18" y="34" width="78" height="44" rx="14" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="120" y="34" width="82" height="44" rx="14" fill="#e0ecff" stroke="#0d47a1" stroke-width="2"/>
        <rect x="224" y="34" width="78" height="44" rx="14" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <rect x="120" y="158" width="82" height="44" rx="14" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <text x="57" y="60" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Browser</text>
        <text x="161" y="60" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Resolver</text>
        <text x="263" y="60" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Authoritative</text>
        <text x="161" y="184" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">IP Answer</text>
        <path d="M96 56 L120 56" stroke="#0d47a1" stroke-width="3"/>
        <path d="M202 56 L224 56" stroke="#f28c28" stroke-width="3"/>
        <path d="M263 78 C263 128, 202 180, 202 180" fill="none" stroke="#f28c28" stroke-width="3"/>
        <path d="M120 180 C86 180, 57 138, 57 78" fill="none" stroke="#0d47a1" stroke-width="3"/>
        <text x="160" y="228" text-anchor="middle" fill="#64748b" font-size="12">Name lookup maps a domain to a reachable host address.</text>
      `;
    }

    if (visual === "http") {
      return `
        <rect x="22" y="88" width="78" height="52" rx="14" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="120" y="34" width="84" height="44" rx="14" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <rect x="120" y="152" width="84" height="44" rx="14" fill="#ffedd5" stroke="#f28c28" stroke-width="2"/>
        <rect x="224" y="88" width="74" height="52" rx="14" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <text x="61" y="118" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Client</text>
        <text x="162" y="60" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">HTTP Request</text>
        <text x="162" y="178" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">HTTP Response</text>
        <text x="261" y="118" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Server/Cache</text>
        <path d="M100 104 L120 68" stroke="#0d47a1" stroke-width="3"/>
        <path d="M204 68 L224 104" stroke="#f28c28" stroke-width="3"/>
        <path d="M224 124 L204 160" stroke="#0d47a1" stroke-width="3"/>
        <path d="M120 160 L100 124" stroke="#f28c28" stroke-width="3"/>
        <text x="160" y="226" text-anchor="middle" fill="#64748b" font-size="12">The same path can support caching, cookies, and persistent connections.</text>
      `;
    }

    if (visual === "clientserver") {
      return `
        <circle cx="160" cy="112" r="34" fill="#dbeafe" stroke="#0d47a1" stroke-width="3"/>
        <circle cx="64" cy="54" r="22" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <circle cx="256" cy="54" r="22" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <circle cx="64" cy="176" r="22" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <circle cx="256" cy="176" r="22" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <text x="160" y="118" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Server</text>
        <text x="64" y="59" text-anchor="middle" fill="#c2410c" font-size="11" font-weight="700">Peer</text>
        <text x="256" y="59" text-anchor="middle" fill="#c2410c" font-size="11" font-weight="700">Peer</text>
        <text x="64" y="181" text-anchor="middle" fill="#c2410c" font-size="11" font-weight="700">Peer</text>
        <text x="256" y="181" text-anchor="middle" fill="#c2410c" font-size="11" font-weight="700">Peer</text>
        <path d="M83 66 L132 96" stroke="#0d47a1" stroke-width="3"/>
        <path d="M237 66 L188 96" stroke="#0d47a1" stroke-width="3"/>
        <path d="M83 164 L132 128" stroke="#f28c28" stroke-width="3"/>
        <path d="M237 164 L188 128" stroke="#f28c28" stroke-width="3"/>
        <text x="160" y="226" text-anchor="middle" fill="#64748b" font-size="12">Centralized service and peer sharing create different scaling tradeoffs.</text>
      `;
    }

    if (visual === "addressing") {
      return `
        <rect x="42" y="76" width="236" height="56" rx="16" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <rect x="42" y="76" width="150" height="56" rx="16" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="192" y="76" width="86" height="56" rx="16" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <text x="116" y="108" text-anchor="middle" fill="#0a2f6b" font-size="14" font-weight="700">Network Prefix</text>
        <text x="235" y="108" text-anchor="middle" fill="#c2410c" font-size="14" font-weight="700">Host</text>
        <text x="160" y="58" text-anchor="middle" fill="#64748b" font-size="12">An address identifies both where the network is and which interface is inside it.</text>
        <text x="160" y="180" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Address = Network + Host</text>
      `;
    }

    if (visual === "transport") {
      return `
        <rect x="28" y="56" width="84" height="140" rx="16" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="208" y="56" width="84" height="140" rx="16" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <rect x="126" y="88" width="68" height="76" rx="16" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <text x="70" y="84" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Host A</text>
        <text x="250" y="84" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Host B</text>
        <text x="160" y="130" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">Transport</text>
        <text x="160" y="148" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">Layer</text>
        <path d="M112 126 L126 126" stroke="#0d47a1" stroke-width="3"/>
        <path d="M194 126 L208 126" stroke="#0d47a1" stroke-width="3"/>
        <text x="70" y="154" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Processes</text>
        <text x="250" y="154" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Processes</text>
        <text x="160" y="222" text-anchor="middle" fill="#64748b" font-size="12">Ports, sockets, and logical communication connect the right apps.</text>
      `;
    }

    if (visual === "tcp") {
      return `
        <line x1="72" y1="38" x2="72" y2="222" stroke="#0d47a1" stroke-width="3"/>
        <line x1="248" y1="38" x2="248" y2="222" stroke="#0d47a1" stroke-width="3"/>
        <text x="72" y="28" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Client</text>
        <text x="248" y="28" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Server</text>
        <path d="M84 70 L236 70" stroke="#f28c28" stroke-width="3"/>
        <path d="M236 118 L84 118" stroke="#0d47a1" stroke-width="3"/>
        <path d="M84 166 L236 166" stroke="#f28c28" stroke-width="3"/>
        <text x="160" y="60" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">SYN</text>
        <text x="160" y="108" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">SYN-ACK</text>
        <text x="160" y="156" text-anchor="middle" fill="#c2410c" font-size="12" font-weight="700">ACK / Data</text>
        <text x="160" y="214" text-anchor="middle" fill="#64748b" font-size="12">Sequence numbers and retransmission logic build reliability on top.</text>
      `;
    }

    if (visual === "flow") {
      return `
        <rect x="34" y="70" width="92" height="120" rx="18" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="194" y="70" width="92" height="120" rx="18" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <rect x="206" y="92" width="68" height="18" rx="9" fill="#fed7aa"/>
        <rect x="206" y="118" width="48" height="18" rx="9" fill="#fdba74"/>
        <rect x="206" y="144" width="28" height="18" rx="9" fill="#fb923c"/>
        <text x="80" y="102" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Sender Window</text>
        <text x="240" y="102" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Receiver Buffer</text>
        <path d="M126 130 L194 130" stroke="#0d47a1" stroke-width="4" stroke-dasharray="10 6"/>
        <text x="160" y="122" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">In flight</text>
        <text x="160" y="214" text-anchor="middle" fill="#64748b" font-size="12">Flow control and pipelining limit overload while keeping the path busy.</text>
      `;
    }

    if (visual === "ip") {
      return `
        <rect x="26" y="52" width="268" height="54" rx="16" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <rect x="40" y="66" width="56" height="26" rx="8" fill="#dbeafe"/>
        <rect x="106" y="66" width="64" height="26" rx="8" fill="#bfdbfe"/>
        <rect x="180" y="66" width="48" height="26" rx="8" fill="#fde68a"/>
        <rect x="238" y="66" width="42" height="26" rx="8" fill="#fdba74"/>
        <text x="68" y="83" text-anchor="middle" fill="#0a2f6b" font-size="11" font-weight="700">Src IP</text>
        <text x="138" y="83" text-anchor="middle" fill="#0a2f6b" font-size="11" font-weight="700">Dst IP</text>
        <text x="204" y="83" text-anchor="middle" fill="#92400e" font-size="11" font-weight="700">TTL</text>
        <text x="259" y="83" text-anchor="middle" fill="#92400e" font-size="11" font-weight="700">Len</text>
        <path d="M70 152 L248 152" stroke="#0d47a1" stroke-width="3"/>
        <text x="160" y="140" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Router decrements TTL and forwards by prefix match</text>
        <text x="160" y="194" text-anchor="middle" fill="#64748b" font-size="12">Header fields help with delivery, loop control, and fragmentation.</text>
      `;
    }

    if (visual === "sdn") {
      return `
        <rect x="108" y="24" width="104" height="42" rx="14" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <rect x="36" y="136" width="68" height="42" rx="14" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="126" y="136" width="68" height="42" rx="14" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <rect x="216" y="136" width="68" height="42" rx="14" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <text x="160" y="49" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Controller</text>
        <text x="70" y="161" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Switch</text>
        <text x="160" y="161" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Router</text>
        <text x="250" y="161" text-anchor="middle" fill="#0a2f6b" font-size="12" font-weight="700">Switch</text>
        <path d="M160 66 L70 136" stroke="#f28c28" stroke-width="3"/>
        <path d="M160 66 L160 136" stroke="#f28c28" stroke-width="3"/>
        <path d="M160 66 L250 136" stroke="#f28c28" stroke-width="3"/>
        <path d="M104 157 L126 157" stroke="#0d47a1" stroke-width="3"/>
        <path d="M194 157 L216 157" stroke="#0d47a1" stroke-width="3"/>
        <text x="160" y="212" text-anchor="middle" fill="#64748b" font-size="12">Control decisions can be distributed per router or centralized by software.</text>
      `;
    }

    if (visual === "as") {
      return `
        <ellipse cx="78" cy="110" rx="54" ry="38" fill="#dbeafe" stroke="#0d47a1" stroke-width="2"/>
        <ellipse cx="160" cy="64" rx="54" ry="38" fill="#eff6ff" stroke="#0d47a1" stroke-width="2"/>
        <ellipse cx="242" cy="110" rx="54" ry="38" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
        <ellipse cx="160" cy="168" rx="54" ry="34" fill="#ffedd5" stroke="#f28c28" stroke-width="2"/>
        <text x="78" y="114" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">AS 1</text>
        <text x="160" y="68" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">AS 2</text>
        <text x="242" y="114" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">AS 3</text>
        <text x="160" y="172" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">AS 4</text>
        <path d="M123 89 L116 84" stroke="#0d47a1" stroke-width="3"/>
        <path d="M197 89 L204 84" stroke="#0d47a1" stroke-width="3"/>
        <path d="M108 139 L133 151" stroke="#f28c28" stroke-width="3"/>
        <path d="M212 151 L237 139" stroke="#f28c28" stroke-width="3"/>
        <text x="160" y="218" text-anchor="middle" fill="#64748b" font-size="12">BGP exchanges policy-aware routes between autonomous systems.</text>
      `;
    }

    return `
      <rect x="34" y="42" width="72" height="50" rx="14" fill="#e0ecff" stroke="#0d47a1" stroke-width="2"/>
      <rect x="124" y="42" width="72" height="50" rx="14" fill="#e0ecff" stroke="#0d47a1" stroke-width="2"/>
      <rect x="214" y="42" width="72" height="50" rx="14" fill="#e0ecff" stroke="#0d47a1" stroke-width="2"/>
      <rect x="124" y="168" width="72" height="50" rx="14" fill="#fff7ed" stroke="#f28c28" stroke-width="2"/>
      <text x="70" y="70" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Input</text>
      <text x="160" y="70" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Router</text>
      <text x="250" y="70" text-anchor="middle" fill="#0a2f6b" font-size="13" font-weight="700">Output</text>
      <text x="160" y="196" text-anchor="middle" fill="#c2410c" font-size="13" font-weight="700">Table</text>
      <path d="M106 67 L124 67" fill="none" stroke="#0d47a1" stroke-width="3"/>
      <path d="M196 67 L214 67" fill="none" stroke="#0d47a1" stroke-width="3"/>
      <path d="M160 92 L160 168" fill="none" stroke="#f28c28" stroke-width="3" stroke-dasharray="8 6"/>
      <circle cx="88" cy="138" r="12" fill="#0d47a1"/>
      <circle cx="126" cy="138" r="12" fill="#0d47a1"/>
      <circle cx="164" cy="138" r="12" fill="#0d47a1"/>
      <circle cx="202" cy="138" r="12" fill="#0d47a1"/>
      <circle cx="240" cy="138" r="12" fill="#0d47a1"/>
      <text x="160" y="248" text-anchor="middle" fill="#64748b" font-size="12">Routing and forwarding use local actions driven by control decisions.</text>
    `;
  }

  function renderVisual(item) {
    if (!item) {
      elements.visualBadge.textContent = "Template";
      elements.visualCaption.textContent = "Add study terms with a visual key to show diagrams here, or keep this area as a general concept companion.";
      elements.conceptVisual.innerHTML = `
        <rect x="36" y="54" width="248" height="152" rx="22" fill="#eef1ff" stroke="#4255ff" stroke-width="2"/>
        <text x="160" y="116" text-anchor="middle" fill="#2f3fd9" font-size="18" font-weight="700">Visual Area</text>
        <text x="160" y="146" text-anchor="middle" fill="#5c6780" font-size="12">Add terms and visuals in assets/js/data.js</text>
      `;
      return;
    }

    const meta = getCategory(item);
    elements.visualBadge.textContent = meta.family;
    elements.visualCaption.textContent = `${meta.topic} visual aid from ${item.packet}. The diagram shifts across delay, DNS, HTTP, TCP, IP, SDN, and inter-AS routing topics.`;
    elements.conceptVisual.innerHTML = buildVisualMarkup(item);
  }

  function renderQuizVisual(item) {
    if (!item) {
      elements.quizConceptVisual.innerHTML = "";
      elements.quizVisualCaption.textContent = "";
      return;
    }

    elements.quizConceptVisual.innerHTML = buildVisualMarkup(item);
    elements.quizVisualCaption.textContent = `${item.topic} from ${item.packet}. Use the diagram to separate close concepts before choosing an answer.`;
  }

  function renderFlashcard() {
    if (!studySet.length) {
      elements.flashcardCounter.textContent = "No cards yet";
      elements.flashcardTerm.textContent = "Add your first study term";
      elements.flashcardDef.textContent = "Open assets/js/data.js and add objects to the studySet array with question, answer, family, topic, packet, and visual fields.";
      elements.flashcardFamily.textContent = "Template · Study set";
      elements.flashcardSubtopic.textContent = "Starter content · Definition";
      elements.flashcardInner.classList.remove("is-flipped");
      renderVisual(null);
      updateStats();
      return;
    }

    const item = studySet[state.flashcardIndex];
    const meta = getCategory(item);

    elements.flashcardCounter.textContent = `Card ${state.flashcardIndex + 1} of ${studySet.length}`;
    elements.flashcardTerm.textContent = item.question;
    elements.flashcardDef.textContent = item.answer;
    elements.flashcardFamily.textContent = `${meta.family} · ${meta.topic}`;
    elements.flashcardSubtopic.textContent = `${item.packet} · ${meta.topic}`;
    elements.flashcardInner.classList.toggle("is-flipped", state.flipped);

    renderVisual(item);
    updateStats();
  }

  function changeCard(step) {
    if (!studySet.length) {
      return;
    }

    state.flashcardIndex = (state.flashcardIndex + step + studySet.length) % studySet.length;
    state.flipped = false;
    renderFlashcard();
  }

  function switchMode(target) {
    state.mode = target;

    elements.modeTabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.modeTarget === target);
    });

    elements.modePanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === target);
    });
  }

  function startQuiz() {
    if (!studySet.length) {
      state.quizOrder = [];
      state.quizPointer = 0;
      state.quizScore = 0;
      renderQuiz();
      updateStats();
      return;
    }

    state.quizOrder = shuffle(studySet.map((_, index) => index));
    state.quizPointer = 0;
    state.quizScore = 0;
    renderQuiz();
    updateStats();
  }

  function getDistractorScore(correctItem, candidate) {
    let score = 0;

    if (candidate.topic === correctItem.topic) {
      score += 10;
    }

    if (candidate.family === correctItem.family) {
      score += 6;
    }

    if (candidate.visual === correctItem.visual) {
      score += 4;
    }

    if (candidate.packet === correctItem.packet) {
      score += 3;
    }

    score -= Math.abs(candidate.answer.length - correctItem.answer.length) / 120;

    return score;
  }

  function buildQuestionOptions(correctIndex) {
    const correctItem = studySet[correctIndex];
    const distractors = studySet
      .map((item, index) => ({ index, score: getDistractorScore(correctItem, item) }))
      .filter(({ index }) => index !== correctIndex)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map(({ index }) => index);

    return shuffle([correctIndex, ...distractors]);
  }

  function renderQuiz() {
    if (!studySet.length) {
      elements.quizProgress.textContent = "No questions loaded";
      elements.quizTerm.textContent = "Add terms to start quiz mode";
      elements.quizOptions.innerHTML = `
        <div class="aside-note">
          Add entries to <code>studySet</code> in <code>assets/js/data.js</code>. Each entry becomes a flashcard, searchable term, and quiz question automatically.
        </div>
      `;
      elements.quizFeedback.textContent = "Once you add study data, quiz mode will generate answer choices here.";
      setNextQuestionEnabled(false);
      renderQuizVisual(null);
      updateStats();
      return;
    }

    if (state.quizPointer >= studySet.length) {
      const percent = Math.round((state.quizScore / studySet.length) * 100);

      elements.quizProgress.textContent = `Completed · ${studySet.length} questions`;
      elements.quizTerm.textContent = "Quiz Complete";
      elements.quizOptions.innerHTML = `
        <div class="aside-note">
          <p class="stats-value">${state.quizScore} / ${studySet.length}</p>
          <p class="panel-copy">Final topic checkpoint accuracy: ${percent}%.</p>
        </div>
      `;
      elements.quizFeedback.textContent = "Restart the quiz for a reshuffled round.";
      setNextQuestionEnabled(false);
      renderQuizVisual(studySet[state.quizOrder[studySet.length - 1]] || studySet[0]);
      updateStats();
      return;
    }

    const correctIndex = state.quizOrder[state.quizPointer];
    const item = studySet[correctIndex];
    const options = buildQuestionOptions(correctIndex);

    elements.quizProgress.textContent = `Question ${state.quizPointer + 1} of ${studySet.length}`;
    elements.quizTerm.textContent = item.question;
    elements.quizFeedback.textContent = "Choose the best matching definition from a closely related set of answers.";
    elements.quizOptions.innerHTML = "";
    setNextQuestionEnabled(false);
    renderQuizVisual(item);

    options.forEach((optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-btn";
      button.dataset.optionIndex = String(optionIndex);
      button.textContent = studySet[optionIndex].answer;
      button.addEventListener("click", () => answerQuestion(optionIndex, correctIndex));
      elements.quizOptions.appendChild(button);
    });
  }

  function answerQuestion(selectedIndex, correctIndex) {
    if (!elements.nextQuestion.disabled) {
      return;
    }

    const buttons = Array.from(elements.quizOptions.querySelectorAll(".answer-btn"));

    buttons.forEach((button) => {
      const optionIndex = Number(button.dataset.optionIndex);
      const isCorrect = optionIndex === correctIndex;
      const isSelected = optionIndex === selectedIndex;

      if (isCorrect) {
        button.classList.add("correct");
      }

      if (isSelected && selectedIndex !== correctIndex) {
        button.classList.add("wrong");
      }

      button.disabled = true;
    });

    if (selectedIndex === correctIndex) {
      state.quizScore += 1;
      elements.quizFeedback.textContent = "Correct. That matches the study answer.";
    } else {
      elements.quizFeedback.textContent = "Incorrect. The correct answer is highlighted.";
    }

    state.quizPointer += 1;
    setNextQuestionEnabled(true);
    updateStats();
  }

  function renderList() {
    if (!studySet.length) {
      elements.resultsCount.textContent = "0 results";
      elements.termList.innerHTML = `
        <div class="aside-note">
          This is an empty study template right now. Add your own terms and definitions to <code>studySet</code> in <code>assets/js/data.js</code>.
        </div>
      `;
      return;
    }

    const query = state.searchTerm.trim().toLowerCase();
    const filtered = studySet.filter(({ question, answer }) => (
      question.toLowerCase().includes(query) || answer.toLowerCase().includes(query)
    ));

    elements.resultsCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
      elements.termList.innerHTML = `
        <div class="aside-note">
          No questions matched that search. Try DNS, flow control, ICMP, Dijkstra, SDN, or autonomous systems.
        </div>
      `;
      return;
    }

    elements.termList.innerHTML = filtered.map((item) => {
      const meta = getCategory(item);
      const tone = getFamilyTone(meta.family);

      return `
        <article class="reference-item">
          <div class="reference-head">
            <div>
              <div class="reference-meta">
                <h3 class="reference-title">${item.question}</h3>
                <span class="badge-family is-${tone}">${meta.family}</span>
                <span class="badge-packet">${item.packet}</span>
              </div>
              <p class="reference-answer">${item.answer}</p>
            </div>
            <div class="reference-topic">${meta.topic}</div>
          </div>
        </article>
      `;
    }).join("");
  }

  function bindEvents() {
    elements.modeTabs.forEach((tab) => {
      tab.addEventListener("click", () => switchMode(tab.dataset.modeTarget));
    });

    elements.heroStartQuiz.addEventListener("click", () => {
      switchMode("quiz");
      startQuiz();
    });

    elements.heroReviewCards.addEventListener("click", () => switchMode("flashcards"));
    elements.heroOpenList.addEventListener("click", () => switchMode("list"));
    elements.themeToggle.addEventListener("click", () => applyTheme(!state.darkMode));

    elements.flashcard.addEventListener("click", () => {
      if (!studySet.length) {
        return;
      }

      state.flipped = !state.flipped;
      renderFlashcard();
    });

    elements.flipCard.addEventListener("click", () => {
      if (!studySet.length) {
        return;
      }

      state.flipped = !state.flipped;
      renderFlashcard();
    });

    elements.prevCard.addEventListener("click", () => changeCard(-1));
    elements.nextCard.addEventListener("click", () => changeCard(1));

    elements.restartQuiz.addEventListener("click", startQuiz);
    elements.nextQuestion.addEventListener("click", renderQuiz);

    elements.searchInput.addEventListener("input", (event) => {
      state.searchTerm = event.target.value;
      renderList();
    });

    elements.clearSearch.addEventListener("click", () => {
      state.searchTerm = "";
      elements.searchInput.value = "";
      renderList();
    });
  }

  function initialize() {
    renderHeroContent();
    renderOverviewThemes();
    bindEvents();
    applyTheme(getInitialTheme());
    renderFlashcard();
    startQuiz();
    renderList();
    switchMode("flashcards");
  }

  initialize();
}());

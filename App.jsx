import { useState, useRef, useEffect } from "react";

const steps = [
  {
    id: "dns", name: "DNS Lookup", label: "DNS",
    dur: 45, color: "#7F77DD",
    desc: "Browser checks local cache → OS cache → Router → ISP DNS resolver → Root nameserver → TLD → Authoritative nameserver",
    details: [
      { k: "Query", v: "A record" }, { k: "Resolver", v: "ISP DNS" }, { k: "TTL", v: "300s" },
      { k: "Cache hit", v: "No" }, { k: "Hops", v: "4" }, { k: "Result", v: "resolving..." },
    ],
    subSteps: [
      { label: "Browser cache", desc: "Check in-memory DNS cache — no entry found", color: "#AFA9EC" },
      { label: "OS cache", desc: "Check /etc/hosts and OS resolver cache — miss", color: "#9F99E0" },
      { label: "ISP resolver", desc: "Query sent to ISP recursive resolver — cache miss, starts full resolution", color: "#7F77DD" },
      { label: "Root nameserver", desc: "ISP asks root (.) → returns TLD nameserver address for .com", color: "#6B63C8" },
      { label: "TLD nameserver", desc: ".com TLD nameserver returns authoritative NS for the domain", color: "#534AB7" },
      { label: "Authoritative NS", desc: "Final hop — authoritative server returns A record with IP address", color: "#3C3489" },
    ],
    logLines: (hostname, ip) => [
      `[0ms] DNS query: ${hostname} A record`,
      `[2ms] Browser cache: miss`,
      `[5ms] OS cache: miss`,
      `[12ms] → ISP resolver cache miss`,
      `[20ms] → Root nameserver queried`,
      `[28ms] → TLD .com nameserver queried`,
      `[38ms] ← Authoritative NS: ${ip} (TTL 300s)`,
    ],
    tagBg: "#EEEDFE", tagColor: "#3C3489",
  },
  {
    id: "tcp", name: "TCP Handshake", label: "TCP",
    dur: 30, color: "#1D9E75",
    desc: "SYN → SYN-ACK → ACK  |  3-way handshake establishes a reliable connection before any data is sent",
    details: [
      { k: "SYN", v: "+0ms" }, { k: "SYN-ACK", v: "+14ms" }, { k: "ACK", v: "+28ms" },
      { k: "Window", v: "65535 B" }, { k: "MSS", v: "1460 B" }, { k: "Port", v: "443" },
    ],
    logLines: (hostname, ip) => [
      `[45ms] TCP SYN → ${ip}:443`,
      `[59ms] ← SYN-ACK received`,
      `[75ms] → ACK sent — connection established`,
    ],
    tagBg: "#E1F5EE", tagColor: "#085041",
  },
  {
    id: "tls", name: "TLS Handshake", label: "TLS",
    dur: 55, color: "#BA7517",
    desc: "Client Hello → Server Hello + Certificate → Key Exchange → Finished  |  Negotiates encryption using ECDHE, then switches to AES-256-GCM",
    details: [
      { k: "Version", v: "TLS 1.3" }, { k: "Cipher", v: "AES-256-GCM" }, { k: "Key Exch", v: "ECDHE" },
      { k: "Cert issuer", v: "DigiCert" }, { k: "OCSP", v: "Valid" }, { k: "Resumed", v: "No" },
    ],
    logLines: () => [
      `[75ms] TLS ClientHello (TLS 1.3)`,
      `[92ms] ← ServerHello + Certificate`,
      `[110ms] Verifying cert chain...`,
      `[130ms] ← Finished — AES-256-GCM active`,
    ],
    tagBg: "#FAEEDA", tagColor: "#633806",
  },
  {
    id: "http", name: "HTTP Request", label: "HTTP",
    dur: 80, color: "#185FA5",
    desc: "GET / HTTP/2  |  Browser sends headers (Host, Accept, User-Agent, Cookies). Server responds with 200 OK and streams the HTML body.",
    details: [
      { k: "Method", v: "GET /" }, { k: "Protocol", v: "HTTP/2" }, { k: "Status", v: "200 OK" },
      { k: "Content-Type", v: "text/html" }, { k: "Size", v: "14.2 KB" }, { k: "Encoding", v: "gzip" },
    ],
    logLines: (hostname) => [
      `[130ms] → GET / HTTP/2`,
      `[145ms]   Host: ${hostname}`,
      `[185ms] ← 200 OK (14.2 KB gzip)`,
      `[210ms]   Content-Type: text/html; charset=UTF-8`,
    ],
    tagBg: "#E6F1FB", tagColor: "#0C447C",
  },
  {
    id: "parse", name: "Parse HTML / DOM", label: "PARSE",
    dur: 60, color: "#993C1D",
    desc: "HTML parser reads bytes → tokens → nodes → DOM tree. CSS parser builds CSSOM in parallel. JS blocks parsing if render-blocking scripts are found. DOM + CSSOM merge into Render Tree.",
    details: [
      { k: "Nodes", v: "847" }, { k: "DOM depth", v: "12 levels" }, { k: "Scripts", v: "3 found" },
      { k: "Stylesheets", v: "2 found" }, { k: "Blocking", v: "1 script" }, { k: "DOMState", v: "loading" },
      { k: "Tokens", v: "~3,200" }, { k: "CSSOM rules", v: "412" }, { k: "Render Tree", v: "612 nodes" },
    ],
    subSteps: [
      { label: "Bytes → Tokens", desc: "HTML bytes decoded to characters, then tokenized (start tags, end tags, text, comments)", color: "#D85A30" },
      { label: "Tokens → Nodes", desc: "Each token becomes a Node object. DOCTYPE, Element, Text, Comment node types created", color: "#BA4A25" },
      { label: "Nodes → DOM Tree", desc: "Nodes linked into a tree: document → html → head/body → children. 847 nodes, depth 12", color: "#993C1D" },
      { label: "CSS → CSSOM", desc: "CSS parser reads stylesheets in parallel. 412 rules matched → CSSOM built. Render-blocking!", color: "#7D2F14" },
      { label: "DOM + CSSOM → Render Tree", desc: "Only visible nodes kept. display:none removed. 847 DOM nodes → 612 Render Tree nodes", color: "#60200C" },
    ],
    logLines: () => [
      `[210ms] HTML tokenizer started (~3,200 tokens)`,
      `[220ms] DOM tree building: 847 nodes, depth 12`,
      `[230ms] Render-blocking script found — parser paused`,
      `[235ms] CSS parser: 412 rules, CSSOM complete`,
      `[240ms] Preload scanner: 6 resources queued`,
      `[265ms] Render Tree: 612 visible nodes`,
      `[270ms] DOMContentLoaded fired`,
    ],
    tagBg: "#FAECE7", tagColor: "#4A1B0C",
  },
  {
    id: "assets", name: "Fetch Assets", label: "ASSETS",
    dur: 120, color: "#993556",
    desc: "Browser opens parallel HTTP/2 streams for CSS, JS, images, fonts. Multiplexing allows all assets on one TCP connection. Critical assets are prioritised by the preload scanner.",
    details: [
      { k: "CSS", v: "2 files (48KB)" }, { k: "JS", v: "3 files (210KB)" }, { k: "Images", v: "6 files (380KB)" },
      { k: "Fonts", v: "2 files (60KB)" }, { k: "Total", v: "698 KB" }, { k: "Cached", v: "3 hits" },
      { k: "Streams", v: "HTTP/2 mux" }, { k: "Priority", v: "CSS > JS > img" }, { k: "TTFB", v: "22ms" },
    ],
    subSteps: [
      { label: "Preload scanner", desc: "Looks ahead in HTML tokens to queue critical resources before parser finishes. CSS + fonts first.", color: "#D4537E" },
      { label: "Priority queue", desc: "Resources ranked: CSS (highest) → fonts → JS → images → lazy-loaded. Ensures render-critical assets arrive first.", color: "#B8436A" },
      { label: "HTTP/2 multiplexing", desc: "All 13 resources fetched over one TCP connection in parallel streams — no head-of-line blocking.", color: "#993556" },
      { label: "Cache check", desc: "3 resources served from disk cache (style.css, logo.png, font.woff2). 10 fetched from network.", color: "#7A2944" },
      { label: "Decompress & decode", desc: "gzip/brotli decompressed. Images decoded (JPEG → bitmap). Fonts parsed (woff2 → glyph tables).", color: "#5C1F33" },
    ],
    logLines: () => [
      `[270ms] Preload scanner: 13 resources queued`,
      `[272ms] Priority: CSS[high] JS[medium] img[low]`,
      `[280ms] style.css 200 (48KB, disk cache)`,
      `[285ms] font.woff2 200 (60KB, disk cache)`,
      `[300ms] app.js 200 (210KB, network)`,
      `[320ms] hero.jpg 200 (380KB, network)`,
      `[380ms] logo.png 200 (disk cache)`,
      `[390ms] All 13 assets loaded — 698KB transferred`,
    ],
    tagBg: "#FBEAF0", tagColor: "#4B1528",
  },
  {
    id: "js", name: "JS Execution", label: "JS",
    dur: 55, color: "#534AB7",
    desc: "V8 engine parses JS → AST → bytecode → JIT compile hot paths to machine code. Event listeners registered. Framework hydration runs. Main thread may block if scripts are heavy.",
    details: [
      { k: "Engine", v: "V8" }, { k: "Scripts", v: "3 files" }, { k: "Parse time", v: "18ms" },
      { k: "Compile", v: "JIT (hot)" }, { k: "Listeners", v: "47 registered" }, { k: "Heap used", v: "12.4 MB" },
      { k: "Call stack", v: "max 14 deep" }, { k: "Microtasks", v: "8 queued" }, { k: "Blocking", v: "22ms main" },
    ],
    subSteps: [
      { label: "Parse → AST", desc: "JS source code parsed into Abstract Syntax Tree. Syntax errors caught here. 3 files, 210KB total.", color: "#7F77DD" },
      { label: "AST → Bytecode", desc: "Ignition interpreter compiles AST to bytecode. Fast startup — no full machine-code compile yet.", color: "#6B63C8" },
      { label: "JIT compilation", desc: "TurboFan compiler detects hot functions (called often) and compiles them to optimized machine code.", color: "#534AB7" },
      { label: "Event loop init", desc: "Call stack executes top-level code. 47 event listeners registered (click, scroll, resize, fetch...).", color: "#3C3489" },
      { label: "Framework hydration", desc: "React/Vue attaches to server-rendered DOM. Virtual DOM diffed vs real DOM. App becomes interactive.", color: "#26215C" },
    ],
    logLines: () => [
      `[390ms] V8: parsing app.js (210KB)`,
      `[400ms] AST built — 3,847 nodes`,
      `[405ms] Ignition bytecode compiled`,
      `[412ms] TurboFan: JIT compiling 6 hot functions`,
      `[420ms] 47 event listeners registered`,
      `[435ms] React hydration: diffing 612 nodes`,
      `[445ms] ✓ App interactive (TTI: 445ms)`,
    ],
    tagBg: "#EEEDFE", tagColor: "#26215C",
  },
  {
    id: "render", name: "Render Pipeline", label: "RENDER",
    dur: 40, color: "#3B6D11",
    desc: "Render Tree → Layout (calculate exact px positions) → Paint (rasterize to pixels) → Composite (GPU merges layers) → Frame displayed at 60fps",
    details: [
      { k: "Render Tree", v: "612 nodes" }, { k: "Layout", v: "18ms" }, { k: "Paint", v: "9ms" },
      { k: "Composite", v: "4ms" }, { k: "Layers", v: "7 GPU layers" }, { k: "FPS", v: "60" },
      { k: "LCP", v: "410ms" }, { k: "CLS", v: "0.02" }, { k: "FID", v: "< 1ms" },
    ],
    subSteps: [
      { label: "Style recalc", desc: "CSS rules matched to every DOM node. Computed styles calculated (font-size, color, margin in px).", color: "#639922" },
      { label: "Layout (reflow)", desc: "Browser calculates exact position and size of every box. Width, height, x/y coordinates in pixels.", color: "#4E7A18" },
      { label: "Layer tree", desc: "Compositor identifies elements that need their own GPU layer: position:fixed, will-change, video, canvas.", color: "#3B6D11" },
      { label: "Paint", desc: "Each layer rasterized: fills, borders, text, shadows drawn as pixels into bitmaps. Done on CPU.", color: "#27500A" },
      { label: "Composite", desc: "GPU merges all layers in correct z-order. Frame uploaded to screen buffer → displayed at 60fps.", color: "#173404" },
    ],
    logLines: () => [
      `[445ms] Style recalculation: 612 nodes`,
      `[452ms] Layout pass: 18ms (612 boxes)`,
      `[458ms] Layer tree: 7 GPU layers identified`,
      `[462ms] Paint: 9ms (rasterizing bitmaps)`,
      `[466ms] Composite: GPU merging layers`,
      `[470ms] ✓ Frame on screen — LCP: 410ms`,
      `[470ms] load event fired`,
    ],
    tagBg: "#EAF3DE", tagColor: "#173404",
  },
];

const SPEED = 4;
const byteMap = { http: 14, parse: 48, assets: 698 };

// How many snapshots correspond to ~5 simulated seconds
// Total sim time ≈ 485ms * SPEED = ~1940ms real. We have ~N snapshots.
// We'll treat SKIP_STEPS as a fixed number of snapshot steps per skip.
const SKIP_STEPS = 8;

const styles = {
  wrap: { padding: "20px", backgroundColor: "#f4f4f4", minHeight: "100vh", fontFamily: "monospace" },
  card: { maxWidth: "900px", margin: "0 auto", backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "12px", overflow: "hidden" },
  header: { padding: "20px", borderBottom: "1px solid #eee", background: "#fafafa" },
  title: { fontSize: "18px", fontWeight: "600", marginBottom: "4px", color: "#111" },
  subtitle: { fontSize: "12px", color: "#888" },
  urlRow: { display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" },
  input: { flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff", fontSize: "13px", fontFamily: "monospace", outline: "none" },
  runBtn: (disabled) => ({ padding: "10px 24px", borderRadius: "8px", border: "none", background: disabled ? "#ccc" : "#111", color: "#fff", cursor: disabled ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "monospace", fontWeight: "600" }),
  playbackRow: { width: "100%", display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", background: "#f0f0f0", padding: "10px 12px", borderRadius: "10px", border: "1px solid #ddd" },
  skipBtn: (disabled) => ({
    padding: "5px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    background: disabled ? "#e8e8e8" : "#fff",
    color: disabled ? "#aaa" : "#333",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "12px",
    fontFamily: "monospace",
    fontWeight: "700",
    flexShrink: 0,
    transition: "all 0.15s",
    userSelect: "none",
  }),
  slider: { flex: 1, cursor: "pointer", accentColor: "#534AB7" },
  sliderLabel: { fontSize: "10px", color: "#666", fontFamily: "monospace", flexShrink: 0, minWidth: "60px", textAlign: "center" },
  metrics: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "#eee", borderBottom: "1px solid #eee" },
  metric: { background: "#fff", padding: "14px 18px" },
  metricLabel: { fontSize: "10px", color: "#999", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" },
  metricVal: (color) => ({ fontSize: "20px", fontWeight: "600", color: color || "#111", fontFamily: "monospace" }),
  body: { display: "flex", minHeight: "500px" },
  timeline: { flex: 1, padding: "16px 0", borderRight: "1px solid #eee" },
  stepRow: { display: "flex", alignItems: "stretch", minHeight: "60px" },
  stepLeft: { width: "150px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-start", padding: "8px 14px 8px 0", textAlign: "right", paddingTop: "14px" },
  stepName: { fontSize: "12px", fontWeight: "600", color: "#222" },
  stepTime: { fontSize: "11px", color: "#aaa", marginTop: "2px" },
  stepCenter: { width: "28px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" },
  dot: (state) => ({
    width: "12px", height: "12px", borderRadius: "50%", marginTop: "18px", flexShrink: 0, zIndex: 1,
    border: state === "idle" ? "2px solid #ddd" : "2px solid " + (state === "running" ? "#EF9F27" : "#1D9E75"),
    background: state === "idle" ? "#fff" : state === "running" ? "#EF9F27" : "#1D9E75",
    boxShadow: state === "running" ? "0 0 0 4px rgba(239,159,39,0.2)" : state === "done" ? "0 0 0 3px rgba(29,158,117,0.15)" : "none",
    transition: "all 0.3s",
  }),
  line: (done) => ({ width: "2px", background: done ? "#1D9E75" : "#eee", flex: 1, margin: "0 auto", transition: "background 0.5s" }),
  stepRight: { flex: 1, padding: "8px 16px 12px" },
  tag: (bg, color) => ({ display: "inline-block", fontSize: "10px", padding: "2px 8px", borderRadius: "99px", fontWeight: "600", background: bg, color: color, marginBottom: "6px", marginTop: "10px" }),
  desc: { fontSize: "12px", color: "#555", lineHeight: "1.6", marginBottom: "8px" },
  detailGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "8px" },
  detailCell: { background: "#f8f8f8", borderRadius: "6px", padding: "6px 10px" },
  detailKey: { fontSize: "9px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" },
  detailVal: { fontSize: "11px", color: "#222", fontFamily: "monospace", marginTop: "2px" },
  barBg: { height: "5px", background: "#f0f0f0", borderRadius: "3px", overflow: "hidden" },
  logPanel: { width: "280px", background: "#0d1117", padding: "14px", overflowY: "auto", maxHeight: "700px" },
  logTitle: { fontSize: "10px", color: "#6e7681", letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase" },
  logLine: { fontSize: "11px", fontFamily: "monospace", lineHeight: "1.7", color: "#8b949e" },
};

function ChainDiagram({ nodes, caption, bgColor, borderColor }) {
  const W = 52, GAP = 7, H = 38;
  const TOTAL = nodes.length * W + (nodes.length - 1) * GAP;
  const markerId = "arr_" + Math.random().toString(36).slice(2);
  return (
    <svg width={TOTAL} height={H + 18} style={{ display: "block", background: bgColor || "transparent", borderRadius: "8px", border: borderColor ? `1px solid ${borderColor}` : "none", padding: borderColor ? "6px" : "0" }}>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#ccc" />
        </marker>
      </defs>
      {nodes.map((n, i) => {
        const x = i * (W + GAP);
        const lines = n.label.split("\n");
        return (
          <g key={i}>
            {i < nodes.length - 1 && (
              <line x1={x + W} y1={H / 2} x2={x + W + GAP} y2={H / 2} stroke="#ccc" strokeWidth="1.5" markerEnd={`url(#${markerId})`} />
            )}
            <rect x={x} y={0} width={W} height={H} rx={5} fill={n.color} />
            {lines.map((line, li) => (
              <text key={li} x={x + W / 2} y={lines.length === 1 ? 23 : li === 0 ? 14 : 28}
                textAnchor="middle" fontSize="8.5" fill={n.textColor || "#fff"} fontFamily="monospace" fontWeight="600">{line}</text>
            ))}
          </g>
        );
      })}
      {caption && (
        <text x={TOTAL / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#bbb" fontFamily="monospace">{caption}</text>
      )}
    </svg>
  );
}

function DnsDiagram() {
  const nodes = [
    { label: "Browser\ncache", color: "#AFA9EC", textColor: "#3C3489" },
    { label: "OS\ncache", color: "#C9C5F2", textColor: "#3C3489" },
    { label: "ISP\nresolver", color: "#7F77DD" },
    { label: "Root\nNS (.)", color: "#6B63C8" },
    { label: "TLD NS\n(.com)", color: "#534AB7" },
    { label: "Auth\nNS", color: "#3C3489" },
  ];
  return (
    <div style={{ margin: "10px 0 6px" }}>
      <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>DNS Resolution Chain</div>
      <ChainDiagram nodes={nodes} caption="MISS → MISS → recurse → referral → referral → A record" />
    </div>
  );
}

function DomDiagram() {
  const nodes = [
    { id: "doc",   label: "document", x: 130, y: 8,   parent: null },
    { id: "html",  label: "<html>",   x: 130, y: 52,  parent: "doc" },
    { id: "head",  label: "<head>",   x: 50,  y: 96,  parent: "html" },
    { id: "body",  label: "<body>",   x: 210, y: 96,  parent: "html" },
    { id: "title", label: "<title>",  x: 0,   y: 140, parent: "head" },
    { id: "meta",  label: "<meta>",   x: 90,  y: 140, parent: "head" },
    { id: "div",   label: "<div>",    x: 165, y: 140, parent: "body" },
    { id: "p",     label: "<p>",      x: 255, y: 140, parent: "body" },
    { id: "text",  label: "#text",    x: 165, y: 184, parent: "div" },
    { id: "span",  label: "<span>",   x: 255, y: 184, parent: "p" },
  ];
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const colorMap = { doc: "#993C1D", html: "#BA4A25", head: "#D85A30", body: "#D85A30", title: "#EF9F27", meta: "#EF9F27", div: "#EF9F27", p: "#EF9F27", text: "#bbb", span: "#bbb" };
  return (
    <div style={{ margin: "10px 0 6px" }}>
      <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>DOM Tree</div>
      <svg width="320" height="210" style={{ display: "block", background: "#fdf6f2", borderRadius: "8px", border: "1px solid #f0d8cc" }}>
        {nodes.filter(n => n.parent).map(n => {
          const p = byId[n.parent];
          return <line key={n.id} x1={p.x + 30} y1={p.y + 18} x2={n.x + 30} y2={n.y} stroke="#ddb89a" strokeWidth="1.5" />;
        })}
        {nodes.map(n => (
          <g key={n.id}>
            <rect x={n.x} y={n.y} width={60} height={22} rx={4} fill={colorMap[n.id]} />
            <text x={n.x + 30} y={n.y + 15} textAnchor="middle" fontSize="9" fill="#fff" fontFamily="monospace" fontWeight="600">{n.label}</text>
          </g>
        ))}
        <text x="4" y="207" fontSize="9" fill="#bbb" fontFamily="monospace">document → html → head/body → elements → text</text>
      </svg>
    </div>
  );
}

function JsDiagram() {
  const nodes = [
    { label: "Source\nJS", color: "#AFA9EC", textColor: "#3C3489" },
    { label: "AST", color: "#9F99E0", textColor: "#3C3489" },
    { label: "Bytecode\nIgnition", color: "#7F77DD" },
    { label: "Machine\nJIT", color: "#534AB7" },
    { label: "Execute", color: "#3C3489" },
  ];
  return (
    <div style={{ margin: "10px 0 6px" }}>
      <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>V8 Engine Pipeline</div>
      <ChainDiagram nodes={nodes} caption="Parse → compile → interpret → JIT optimize → run" />
    </div>
  );
}

function RenderDiagram() {
  const nodes = [
    { label: "Style\nrecalc", color: "#97C459", textColor: "#173404" },
    { label: "Layout\nreflow", color: "#639922" },
    { label: "Layer\ntree", color: "#4E7A18" },
    { label: "Paint\nCPU", color: "#3B6D11" },
    { label: "Composite\nGPU", color: "#173404" },
  ];
  return (
    <div style={{ margin: "10px 0 6px" }}>
      <div style={{ fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Render Pipeline</div>
      <ChainDiagram nodes={nodes} caption="CSS match → box model → GPU layers → rasterize → display" />
    </div>
  );
}

function SubStepsList({ subSteps, active }) {
  return (
    <div style={{ margin: "10px 0 8px", borderLeft: "2px solid #eee", paddingLeft: "12px" }}>
      {subSteps.map((s, i) => (
        <div key={i} style={{ marginBottom: "8px", opacity: i <= active ? 1 : 0.25, transition: "opacity 0.4s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, background: i <= active ? s.color : "#ddd", transition: "background 0.3s" }} />
            <span style={{ fontSize: "11px", fontWeight: "600", color: i <= active ? s.color : "#bbb" }}>{s.label}</span>
          </div>
          {i <= active && (
            <div style={{ fontSize: "11px", color: "#666", marginTop: "3px", lineHeight: "1.5", paddingLeft: "15px" }}>{s.desc}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function BarFill({ color, active }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (active) setWidth(100);
    else setWidth(0);
  }, [active]);
  return <div style={{ height: "100%", width: width + "%", background: color, borderRadius: "3px", transition: "width 0.8s ease" }} />;
}

const diagrams = { dns: DnsDiagram, parse: DomDiagram, js: JsDiagram, render: RenderDiagram };

export default function App() {
  const [url, setUrl] = useState("https://google.com");
  const [running, setRunning] = useState(false);
  const [stepStates, setStepStates] = useState(steps.map(() => "idle"));
  const [lineDone, setLineDone] = useState(steps.map(() => false));
  const [stepTimes, setStepTimes] = useState(steps.map(() => "—"));
  const [activeSteps, setActiveSteps] = useState(steps.map(() => false));
  const [barActive, setBarActive] = useState(steps.map(() => false));
  const [stepDetails, setStepDetails] = useState(steps.map(s => s.details));
  const [subActives, setSubActives] = useState(steps.map(() => -1));
  const [logLines, setLogLines] = useState([{ text: "[ready] Enter a URL and press RUN", color: "#6e7681" }]);
  const [metrics, setMetrics] = useState({ time: "0 ms", ip: "—", proto: "—", bytes: "0 KB" });

  const [history, setHistory] = useState([]);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const timers = useRef([]);
  const historyRef = useRef([]);

  const addLog = (lines, color = "#8b949e") => {
    setLogLines(prev => [...prev, ...lines.map(text => ({ text, color }))]);
  };

  // Apply a snapshot to all state
  const applySnapshot = (snap) => {
    setStepStates(snap.stepStates);
    setLineDone(snap.lineDone);
    setStepTimes(snap.stepTimes);
    setActiveSteps(snap.activeSteps);
    setBarActive(snap.barActive);
    setMetrics(snap.metrics);
    setSubActives(snap.subActives);
    setLogLines(snap.logLines);
  };

  const handlePlaybackChange = (e) => {
    const idx = parseInt(e.target.value);
    setPlaybackIndex(idx);
    const snap = historyRef.current[idx];
    if (snap) applySnapshot(snap);
  };

  // ── NEW: skip backward / forward by SKIP_STEPS snapshots ──
  const skipBack = () => {
    const currentIdx = playbackIndex === -1 ? historyRef.current.length - 1 : playbackIndex;
    const newIdx = Math.max(0, currentIdx - SKIP_STEPS);
    setPlaybackIndex(newIdx);
    const snap = historyRef.current[newIdx];
    if (snap) applySnapshot(snap);
  };

  const skipForward = () => {
    const currentIdx = playbackIndex === -1 ? historyRef.current.length - 1 : playbackIndex;
    const maxIdx = historyRef.current.length - 1;
    const newIdx = Math.min(maxIdx, currentIdx + SKIP_STEPS);
    // If we reach the end, switch to "LIVE" mode
    if (newIdx >= maxIdx) {
      setPlaybackIndex(-1);
    } else {
      setPlaybackIndex(newIdx);
    }
    const snap = historyRef.current[newIdx] || historyRef.current[maxIdx];
    if (snap) applySnapshot(snap);
  };

  const runSim = async () => {
    if (running) return;
    setRunning(true);
    historyRef.current = [];
    setHistory([]);
    setPlaybackIndex(-1);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setStepStates(steps.map(() => "idle"));
    setLineDone(steps.map(() => false));
    setStepTimes(steps.map(() => "—"));
    setActiveSteps(steps.map(() => false));
    setBarActive(steps.map(() => false));
    setSubActives(steps.map(() => -1));

    const rawUrl = url || "https://google.com";
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;
    let hostname = rawUrl;
    try { hostname = new URL(fullUrl).hostname; } catch {}

    setLogLines([{ text: `[0ms] Navigating to ${fullUrl}`, color: "#58a6ff" }]);
    setMetrics({ time: "0 ms", ip: "resolving...", proto: "—", bytes: "0 KB" });

    let resolvedIp = "DNS failed";
    try {
      const res = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
      const data = await res.json();
      resolvedIp = data.Answer?.[0]?.data || "Not found";
    } catch { resolvedIp = "DNS failed"; }

    setStepDetails(prev => prev.map((details, i) =>
      i === 0 ? details.map(d => d.k === "Result" ? { ...d, v: resolvedIp } : d) : details
    ));

    // Snapshot helper — captures current React state via setters
    // We use a closure trick: capture variables as they evolve
    let snap_stepStates = steps.map(() => "idle");
    let snap_lineDone = steps.map(() => false);
    let snap_stepTimes = steps.map(() => "—");
    let snap_activeSteps = steps.map(() => false);
    let snap_barActive = steps.map(() => false);
    let snap_metrics = { time: "0 ms", ip: "resolving...", proto: "—", bytes: "0 KB" };
    let snap_subActives = steps.map(() => -1);
    let snap_logLines = [{ text: `[0ms] Navigating to ${fullUrl}`, color: "#58a6ff" }];

    const pushSnap = () => {
      const s = {
        stepStates: [...snap_stepStates],
        lineDone: [...snap_lineDone],
        stepTimes: [...snap_stepTimes],
        activeSteps: [...snap_activeSteps],
        barActive: [...snap_barActive],
        metrics: { ...snap_metrics },
        subActives: [...snap_subActives],
        logLines: [...snap_logLines],
      };
      historyRef.current.push(s);
      setHistory(prev => [...prev, s]);
    };

    let elapsed = 0;
    let totalBytes = 0;

    steps.forEach((s, i) => {
      const startAt = elapsed;
      elapsed += s.dur;
      const endAt = elapsed;

      timers.current.push(setTimeout(() => {
        // Update shadow state
        snap_stepStates = snap_stepStates.map((v, j) => j === i ? "running" : v);
        snap_activeSteps = snap_activeSteps.map((v, j) => j === i ? true : v);
        snap_barActive = snap_barActive.map((v, j) => j === i ? true : v);
        snap_stepTimes = snap_stepTimes.map((v, j) => j === i ? `+${startAt}ms` : v);
        const newLines = s.logLines(hostname, resolvedIp).map(text => ({ text, color: "#8b949e" }));
        snap_logLines = [...snap_logLines, ...newLines];
        if (i === 0) snap_metrics = { ...snap_metrics, ip: resolvedIp };
        if (i === 2) snap_metrics = { ...snap_metrics, proto: "TLS 1.3 / H2" };

        // Apply to React state
        setStepStates([...snap_stepStates]);
        setActiveSteps([...snap_activeSteps]);
        setBarActive([...snap_barActive]);
        setStepTimes([...snap_stepTimes]);
        addLog(s.logLines(hostname, resolvedIp));
        if (i === 0) setMetrics(m => ({ ...m, ip: resolvedIp }));
        if (i === 2) setMetrics(m => ({ ...m, proto: "TLS 1.3 / H2" }));

        pushSnap();

        if (s.subSteps) {
          s.subSteps.forEach((_, si) => {
            timers.current.push(setTimeout(() => {
              snap_subActives = snap_subActives.map((v, j) => j === i ? si : v);
              setSubActives([...snap_subActives]);
              pushSnap();
            }, si * 260));
          });
        }
      }, startAt * SPEED));

      timers.current.push(setTimeout(() => {
        snap_stepStates = snap_stepStates.map((v, j) => j === i ? "done" : v);
        snap_lineDone = snap_lineDone.map((v, j) => j === i ? true : v);
        totalBytes += byteMap[s.id] || 0;
        snap_metrics = { ...snap_metrics, time: endAt + " ms", bytes: totalBytes + " KB" };

        setStepStates([...snap_stepStates]);
        setLineDone([...snap_lineDone]);
        setMetrics({ ...snap_metrics });

        if (i === steps.length - 1) {
          setRunning(false);
          const doneLog = { text: `[${endAt}ms] ✓ Page fully loaded in ${endAt}ms`, color: "#3fb950" };
          snap_logLines = [...snap_logLines, doneLog];
          setLogLines(prev => [...prev, doneLog]);
        }

        pushSnap();
      }, endAt * SPEED));
    });
  };

  const histLen = historyRef.current.length || history.length;
  const currentIdx = playbackIndex === -1 ? histLen - 1 : playbackIndex;
  const canSkipBack = histLen > 0 && currentIdx > 0;
  const canSkipForward = histLen > 0 && currentIdx < histLen - 1;

  // Compute a human-readable time label for the slider position
  const getSnapLabel = (idx) => {
    if (idx < 0 || histLen === 0) return "LIVE";
    const pct = histLen > 1 ? idx / (histLen - 1) : 1;
    const totalSimMs = 485; // approximate total sim duration in ms
    const simMs = Math.round(pct * totalSimMs);
    return `~${simMs}ms`;
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.title}>Browser Request Lifecycle</div>
          <div style={styles.subtitle}>Real-time emulation of what happens when you visit a URL</div>
          <div style={styles.urlRow}>
            <input
              style={styles.input}
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runSim()}
              placeholder="https://google.com"
            />
            <button style={styles.runBtn(running)} onClick={runSim} disabled={running}>
              {running ? "RUNNING..." : "RUN"}
            </button>
          </div>

          {/* ── Playback Controls ── */}
          {histLen > 0 && (
            <div style={styles.playbackRow}>
              {/* Label */}
              <span style={{ fontSize: "10px", color: "#555", fontWeight: "700", letterSpacing: "0.05em", flexShrink: 0 }}>
                REPLAY
              </span>

              {/* −5s skip button */}
              <button
                style={styles.skipBtn(!canSkipBack)}
                onClick={skipBack}
                disabled={!canSkipBack}
                title="Skip back ~5 steps"
              >
                ◀◀ −5s
              </button>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max={histLen - 1}
                value={currentIdx >= 0 ? currentIdx : histLen - 1}
                onChange={handlePlaybackChange}
                style={styles.slider}
              />

              {/* +5s skip button */}
              <button
                style={styles.skipBtn(!canSkipForward)}
                onClick={skipForward}
                disabled={!canSkipForward}
                title="Skip forward ~5 steps"
              >
                +5s ▶▶
              </button>

              {/* Current position label */}
              <span style={styles.sliderLabel}>
                {playbackIndex === -1
                  ? <span style={{ color: "#3fb950", fontWeight: "700" }}>● LIVE</span>
                  : <span style={{ color: "#534AB7", fontWeight: "700" }}>{getSnapLabel(playbackIndex)}</span>
                }
              </span>
            </div>
          )}
        </div>

        <div style={styles.metrics}>
          {[
            { label: "Total Time", val: metrics.time, color: "#185FA5" },
            { label: "IP Address", val: metrics.ip, color: "#222" },
            { label: "Protocol", val: metrics.proto, color: "#1D9E75" },
            { label: "Transferred", val: metrics.bytes, color: "#BA7517" },
          ].map(m => (
            <div key={m.label} style={styles.metric}>
              <div style={styles.metricLabel}>{m.label}</div>
              <div style={styles.metricVal(m.color)}>{m.val}</div>
            </div>
          ))}
        </div>

        <div style={styles.body}>
          <div style={styles.timeline}>
            {steps.map((s, i) => {
              const DiagramComp = diagrams[s.id];
              return (
                <div key={s.id} style={styles.stepRow}>
                  <div style={styles.stepLeft}>
                    <div style={styles.stepName}>{s.name}</div>
                    <div style={styles.stepTime}>{stepTimes[i]}</div>
                  </div>
                  <div style={styles.stepCenter}>
                    <div style={styles.dot(stepStates[i])} />
                    {i < steps.length - 1 && <div style={styles.line(lineDone[i])} />}
                  </div>
                  <div style={styles.stepRight}>
                    <div style={styles.tag(s.tagBg, s.tagColor)}>{s.label}</div>
                    {activeSteps[i] && (
                      <>
                        <div style={styles.desc}>{s.desc}</div>
                        <div style={styles.detailGrid}>
                          {stepDetails[i].map(d => (
                            <div key={d.k} style={styles.detailCell}>
                              <div style={styles.detailKey}>{d.k}</div>
                              <div style={styles.detailVal}>{d.v}</div>
                            </div>
                          ))}
                        </div>
                        {s.subSteps && <SubStepsList subSteps={s.subSteps} active={subActives[i]} />}
                        {DiagramComp && <DiagramComp />}
                        <div style={styles.barBg}>
                          <BarFill color={s.color} active={barActive[i]} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.logPanel}>
            <div style={styles.logTitle}>Network Log</div>
            {logLines.map((l, i) => (
              <div key={i} style={{ ...styles.logLine, color: l.color }}>{l.text}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

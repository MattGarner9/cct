/* Coastal Test Lab – shared app for the hub (index.html) and scenario pages (scenario.html).
   Everything is driven by scenarios.json. For scenario pages the CXone script is built from the JSON
   (plus any local overrides saved from the Test Panel) and injected into <head>, so Guide / Chat load
   exactly as they would from a hand-written script tag. */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (x) {
    return String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } },
    set: function (k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    raw: function (k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    setRaw: function (k, v) { try { localStorage.setItem(k, v); } catch (_) {} }
  };

  /* ---------- theme ---------- */
  function applyTheme() {
    var t = store.raw("cct:theme");
    if (!t) t = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = t;
    return t;
  }

  /* ---------- helpers ---------- */
  function integ(data, key) { return data.integrations[key] || { label: key, color: "#667" }; }
  function badge(data, key) { var i = integ(data, key); return '<span class="badge" style="--c:' + esc(i.color) + '">' + esc(i.label) + "</span>"; }
  function scenarioUrl(id) { return "scenario.html?scenario=" + encodeURIComponent(id); }
  function currentEnv(data) {
    var s = data.settings, k = store.raw("cct:env") || s.defaultEnvironment;
    return s.environments[k] ? k : s.defaultEnvironment;
  }

  /* ---------- script building (what is shown == what is injected) ---------- */
  var LOADER_SNIPPET = '(function(n,u){ window.CXoneDfo=n, window[n]=window[n]||function(){(window[n].q=window[n].q||[]).push(arguments)},window[n].u=u, e=document.createElement("script"),e.type="module",e.src=u+"?"+Math.round(Date.now()/1e3/3600), document.head.appendChild(e) })(\'cxone\',\'%LOADER%\');';

  function eventLines(s) {
    if (!s.events || !s.events.length) return [];
    return [
      "const guideEvents = [" + s.events.map(function (e) { return "'" + e + "'"; }).join(", ") + "];",
      "function handleEvent(event) { console.log('Entire event:', event); console.log('Event Detail property:', event.detail); }",
      "guideEvents.forEach(eventType => window.addEventListener(eventType, handleEvent));"
    ];
  }
  function buildCode(s, tenant, extra, loader) {
    var lines = [LOADER_SNIPPET.replace("%LOADER%", loader), "cxone('init', '" + tenant + "');"]
      .concat(s.calls || [], eventLines(s));
    if (extra && extra.trim()) lines = lines.concat(extra.split("\n"));
    return lines.join("\n");
  }
  function getCfg(s) {
    var o = store.get("cct:" + s.id) || {};
    return {
      tenant: o.tenant || s.tenant,
      extra: o.extra != null ? o.extra : (s.extra || []).join("\n"),
      overridden: !!(o.tenant || o.extra != null)
    };
  }

  /* ---------- shared chrome ---------- */
  function renderTopbar(data, crumbsHtml) {
    var envs = data.settings.environments, keys = Object.keys(envs), cur = currentEnv(data);
    var envHtml = keys.length > 1
      ? '<div class="env">Env <select id="env">' + keys.map(function (k) { return '<option value="' + esc(k) + '"' + (k === cur ? " selected" : "") + ">" + esc(envs[k].label) + "</option>"; }).join("") + "</select></div>"
      : "";
    $("#topbar").className = "topbar";
    $("#topbar").innerHTML =
      '<a class="logo" href="index.html"><svg viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="currentColor" opacity=".12"/><path d="M3 20c4-5 7 5 11 0s7 5 11 0 4-3 4-3v10H3z" fill="currentColor"/><circle cx="22" cy="10" r="4" fill="#d9822b"/></svg><span>' + esc(data.settings.siteTitle) + "</span></a>" +
      '<div class="crumbs">' + crumbsHtml + "</div>" + envHtml +
      '<div class="ctl"><button class="btn" id="theme"></button></div>';
    var themeBtn = $("#theme");
    function label() { themeBtn.textContent = document.documentElement.dataset.theme === "dark" ? "Light" : "Dark"; }
    label();
    themeBtn.onclick = function () {
      var d = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = d; store.setRaw("cct:theme", d); label();
    };
    var sel = $("#env");
    if (sel) sel.onchange = function () { store.setRaw("cct:env", sel.value); location.reload(); };
    $("#footer").innerHTML = esc(data.settings.photoCredit || "");
  }

  /* ---------- hub ---------- */
  function overlapWarnings(list) {
    var out = [], path = location.origin + location.pathname;
    list.forEach(function (a) {
      list.forEach(function (b) { if (a !== b && b.id.indexOf(a.id) !== -1) out.push(a.id + " is contained in " + b.id); });
      if (path.indexOf(a.id) !== -1) out.push(a.id + " appears in this page's own URL path");
    });
    return out;
  }
  function renderHub(data) {
    renderTopbar(data, "<b>Scenario Hub</b>");
    document.title = data.settings.siteTitle + " – CXone Integration Scenarios";
    var list = data.scenarios, cats = ["All"].concat(list.map(function (s) { return s.category; }).filter(function (c, i, a) { return a.indexOf(c) === i; }));
    var filter = "All", q = "", warnings = overlapWarnings(list);
    function draw() {
      var shown = list.filter(function (s) {
        return (filter === "All" || s.category === filter) &&
          (s.title + " " + s.description + " " + (s.tags || []).join(" ")).toLowerCase().indexOf(q) !== -1;
      });
      $("#app").innerHTML =
        '<div class="hero"><div class="in"><h1>CXone Integration Test Lab</h1><p>Pick a scenario to load it in a realistic customer page, with the integration, config and expected behavior shown alongside.</p></div></div>' +
        '<div class="wrap">' +
        (warnings.length ? '<div class="warn"><b>URL overlap warning</b> (Guide rules match any part of the URL): ' + esc(warnings.join("; ")) + "</div>" : "") +
        '<div class="filters">' + cats.map(function (c) { return '<button class="chip' + (c === filter ? " on" : "") + '" data-c="' + esc(c) + '">' + esc(c) + "</button>"; }).join("") +
        '<input class="search" id="q" placeholder="Search scenarios…" value="' + esc(q) + '"></div>' +
        '<div class="grid">' + (shown.map(function (s) {
          return '<a class="card" href="' + scenarioUrl(s.id) + '" style="--c:' + esc(integ(data, s.integration).color) + '">' +
            '<div class="row">' + badge(data, s.integration) + '<span class="meta">Tenant ' + esc(s.tenant) + "</span></div>" +
            "<h3>" + esc(s.title) + "</h3><p>" + esc(s.description) + "</p>" +
            '<div class="row"><div class="tags">' + (s.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + '</div><span class="btn primary">Launch ›</span></div></a>';
        }).join("") || '<div class="empty">No scenarios match.</div>') +
        '<div class="card add" style="--c:var(--line)"><h3>+ Add a scenario</h3><p>Add one entry to <code>scenarios.json</code> and it appears here automatically. See the README.</p></div>' +
        "</div></div>";
      Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (b) { b.onclick = function () { filter = b.dataset.c; draw(); }; });
      var qi = $("#q");
      qi.oninput = function () { q = qi.value.toLowerCase(); var p = qi.selectionStart; draw(); var n = $("#q"); n.focus(); n.setSelectionRange(p, p); };
    }
    draw();
  }

  /* ---------- scenario page ---------- */
  function portal() {
    return '<div class="tile"><h4>Welcome back</h4><p>Customer-facing page where the CXone widget is injected. Replace with real portal content per scenario.</p>' +
      '<div class="portal"><button class="btn">Check balance</button><button class="btn">Pay a bill</button><button class="btn">Contact us</button></div></div>' +
      '<div class="tile"><h4>Recent activity</h4><p>No recent transactions to display.</p></div>';
  }
  function support() {
    return '<div class="tile"><h4>How can we help?</h4><input class="search" style="max-width:none;width:100%;margin:6px 0" placeholder="Search help articles…">' +
      '<div class="portal"><button class="btn">Reset password</button><button class="btn">Card replacement</button><button class="btn">Fees</button></div></div>' +
      '<div class="tile"><h4>Popular articles</h4><p>Setting up alerts · Disputing a charge · Branch hours</p></div>';
  }
  function logLine(text) {
    var log = $("#log"); if (!log) return;
    if (log.dataset.empty) { log.innerHTML = ""; delete log.dataset.empty; }
    var d = document.createElement("div"), t = document.createElement("time");
    t.textContent = new Date().toLocaleTimeString(); d.appendChild(t); d.appendChild(document.createTextNode(text));
    log.appendChild(d); log.scrollTop = log.scrollHeight;
  }

  function renderScenario(data) {
    var id = new URLSearchParams(location.search).get("scenario");
    var list = data.scenarios, idx = -1;
    list.forEach(function (s, i) { if (s.id === id) idx = i; });
    if (idx < 0) {
      renderTopbar(data, '<a href="index.html">Hub</a> › <b>Not found</b>');
      $("#app").innerHTML = '<div class="wrap"><p class="empty">No scenario named “' + esc(id || "") + '”. <a href="index.html" style="text-decoration:underline">Back to the hub</a></p></div>';
      return;
    }
    var s = list[idx], prev = list[(idx + list.length - 1) % list.length], next = list[(idx + 1) % list.length];
    var envKey = currentEnv(data), env = data.settings.environments[envKey];
    var loader = s.loader || env.loader, cfg = getCfg(s);
    var code = buildCode(s, cfg.tenant, cfg.extra, loader);
    var hero = s.hero || data.settings.defaultHero, hero800 = s.hero800 || data.settings.defaultHero800;
    var jsonEntry = JSON.stringify(s, null, 2);

    document.title = s.title + " – " + data.settings.siteTitle;
    renderTopbar(data, '<a href="index.html">Hub</a> › ' + esc(integ(data, s.integration).label) + " › <b>" + esc(s.title) + "</b>");

    $("#app").innerHTML =
      '<div class="layout"><div class="site">' +
      '<div class="sitehead"><strong>California Coastal Bank</strong><nav><a>Accounts</a><a>Cards</a><a>Loans</a><a>Help</a></nav></div>' +
      '<div class="sitehero"' + (data.settings.heroFallback ? ' style="background-image:url(' + esc(data.settings.heroFallback) + ')"' : "") + ">" +
      '<img alt="Sunset over a California pier" src="' + esc(hero) + '"' + (hero800 ? ' srcset="' + esc(hero800) + " 800w, " + esc(hero) + ' 1600w" sizes="(max-width:900px) 100vw, 70vw"' : "") + ' onerror="this.remove()">' +
      "<h2>" + esc(s.siteName || "Customer Portal") + "</h2></div>" +
      '<div class="sitebody">' + (s.site === "support" ? support() : portal()) + "</div>" +
      '<div class="note">URL: <code>scenario.html?scenario=' + esc(s.id) + "</code> (Guide rules match on this)</div></div>" +

      '<aside class="panel">' +
      '<div class="panelhead"><h3>Test panel</h3><a class="btn" href="index.html">Back to hub</a></div>' +
      "<div>" + badge(data, s.integration) + '<p class="title">' + esc(s.title) + "</p></div>" +
      '<div class="status" id="status"><span class="dot"></span><span id="statustext">Loading CXone loader…</span></div>' +
      '<dl class="kv"><dt>Integration</dt><dd>' + esc(integ(data, s.integration).label) + "</dd>" +
      '<dt>Tenant</dt><dd><input class="field" id="tenant" value="' + esc(cfg.tenant) + '">' + (cfg.overridden ? ' <span class="tag">local override</span>' : "") + "</dd>" +
      "<dt>Environment</dt><dd>" + esc(env.label) + "</dd>" +
      "<dt>Category</dt><dd>" + esc(s.category) + "</dd>" +
      (s.legacyPage ? "<dt>Old page</dt><dd>" + esc(s.legacyPage) + "</dd>" : "") +
      "<dt>Tags</dt><dd>" + esc((s.tags || []).join(", ")) + "</dd></dl>" +
      '<div class="how"><b>How to trigger</b><br>' + esc(s.how || "") + "</div>" +
      '<div><h3>Additional script lines</h3><textarea id="extra" rows="4" placeholder="e.g. cxone(\'guide\',\'setCustomCss\', …);">' + esc(cfg.extra) + "</textarea>" +
      '<div class="hint">Appended after the init calls. “Apply &amp; reload” saves them in this browser only; put them in the scenario’s <code>extra</code> field in scenarios.json to make them permanent.</div></div>' +
      '<div><h3>Full script tag</h3><pre id="snip"></pre></div>' +
      '<div class="actions"><button class="btn primary" id="apply">Apply &amp; reload</button><button class="btn" id="copy">Copy script</button><button class="btn" id="reset">Reset to JSON</button></div>' +
      "<details><summary>Scenario JSON entry</summary><pre>" + esc(jsonEntry) + "</pre></details>" +
      '<div><h3>Event log</h3><div class="log" id="log" data-empty="1"><div>' + (s.events && s.events.length ? "Waiting for events…" : "No event listeners on this scenario.") + "</div></div>" +
      (s.events && s.events.length ? '<div class="actions" style="margin-top:6px"><button class="btn" id="clearlog">Clear log</button></div>' : "") + "</div>" +
      '<div class="pn"><a class="btn" href="' + scenarioUrl(prev.id) + '">‹ Prev</a><a class="btn" href="' + scenarioUrl(next.id) + '">Next ›</a></div>' +
      "</aside></div>";

    function cur() { return { tenant: ($("#tenant").value || "").trim() || s.tenant, extra: $("#extra").value }; }
    function showScript() { var c = cur(); $("#snip").textContent = "<script>\n" + buildCode(s, c.tenant, c.extra, loader) + "\n</script>"; }
    showScript();
    $("#tenant").oninput = showScript; $("#extra").oninput = showScript;
    $("#copy").onclick = function (e) {
      if (navigator.clipboard) navigator.clipboard.writeText($("#snip").textContent);
      e.target.textContent = "Copied"; setTimeout(function () { e.target.textContent = "Copy script"; }, 1200);
    };
    $("#apply").onclick = function () { store.set("cct:" + s.id, cur()); location.reload(); };
    $("#reset").onclick = function () { store.set("cct:" + s.id, null); location.reload(); };
    var cl = $("#clearlog"); if (cl) cl.onclick = function () { $("#log").innerHTML = ""; };

    /* on-page event log (the injected script also console.logs each event) */
    (s.events || []).forEach(function (name) {
      window.addEventListener(name, function (ev) {
        var d = ""; try { d = JSON.stringify(ev.detail); } catch (_) {}
        logLine(name + (d && d !== "undefined" ? "  " + (d.length > 140 ? d.slice(0, 140) + "…" : d) : ""));
      });
    });

    /* inject the real CXone script (saved overrides included) */
    var st = $("#status"), stt = $("#statustext");
    function setStatus(cls, msg) { st.className = "status " + cls; stt.textContent = msg; }
    try {
      var el = document.createElement("script");
      el.textContent = code;
      document.head.appendChild(el);
      var base = loader;
      var loaderEl = Array.prototype.slice.call(document.head.querySelectorAll("script[src]")).filter(function (x) { return x.src.indexOf(base) === 0; })[0];
      var label = env.label + " · init " + cfg.tenant;
      if (loaderEl) {
        loaderEl.addEventListener("load", function () { setStatus("ok", "Loader ready · " + label); });
        loaderEl.addEventListener("error", function () { setStatus("bad", "Loader failed to load · " + label); });
      } else {
        setStatus("bad", "Script injection failed · " + label);
      }
    } catch (err) {
      setStatus("bad", "Script error: " + err.message);
    }
  }

  /* ---------- boot ---------- */
  applyTheme();
  fetch("scenarios.json", { cache: "no-cache" })
    .then(function (r) { if (!r.ok) throw new Error("scenarios.json: HTTP " + r.status); return r.json(); })
    .then(function (data) {
      if (document.body.dataset.page === "scenario") renderScenario(data); else renderHub(data);
    })
    .catch(function (err) {
      $("#app").innerHTML = '<p class="empty">Could not load scenarios.json (' + esc(err.message) + "). If you opened this file directly from disk, serve the folder over http instead, e.g. <code>python -m http.server</code>.</p>";
    });
})();

(function () {
  const M = window.AssetBoardMock;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    user: null,
    route: "login",
    params: {},
    pf: {
      home: { day: "today", nodeTab: "normal" },
      node: { sn: "", place: "" },
      exceptions: { type: "all", idle: "5", status: "open" },
      trend: { node: "", mode: "line", pinToday: true, dataset: "normal", range: "7", month: "" },
    },
    demoEmpty: false,
    demoError: false,
    exceptions: M.EXCEPTIONS.map((x) => ({ ...x })),
    toastTimer: null,
    calMonth: null,
  };

  function saveSession() {
    sessionStorage.setItem("asset-board-user", JSON.stringify(state.user));
    sessionStorage.setItem("asset-board-demo", JSON.stringify({ empty: state.demoEmpty, error: state.demoError }));
  }
  function loadSession() {
    try {
      state.user = JSON.parse(sessionStorage.getItem("asset-board-user") || "null");
      const d = JSON.parse(sessionStorage.getItem("asset-board-demo") || "{}");
      state.demoEmpty = !!d.empty;
      state.demoError = !!d.error;
      if (state.user && !M.ACCOUNTS.some((a) => a.phone === state.user.phone)) {
        state.user = { ...M.ACCOUNTS[0] };
      }
    } catch (_) { state.user = null; }
  }

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function money(n) { return n == null ? "—" : "¥ " + Number(n).toFixed(1) + " 万"; }
  function nodeName(id) { return (M.NODES.find((s) => s.id === id) || {}).name || id; }
  function cityName(id) { return (M.CITIES.find((r) => r.id === id) || {}).name || id; }
  function currentSnap() {
    return M.SNAPSHOTS.find((s) => s.id === ((state.pf.home || {}).day || "today")) || M.SNAPSHOTS[0];
  }
  function citiesByAsset(nodeId) {
    const counts = M.NODE_CITIES[nodeId] || {};
    return M.CITIES.slice().sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
  }
  function timeBtn(nodeId) {
    return `<button type="button" class="time-btn" data-open="trend" data-node="${nodeId}" aria-label="时间趋势">⏱</button>`;
  }

  function parseHash() {
    const raw = (location.hash || "#/login").replace(/^#/, "");
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    const query = {};
    if (qs) new URLSearchParams(qs).forEach((v, k) => { query[k] = v; });
    return { parts, query };
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function topBar(title, opts) {
    opts = opts || {};
    const snap = currentSnap();
    const gen = snap.id === "today" && snap.generatedAt
      ? `<div class="meta">数据生成 ${snap.date} ${snap.generatedAt}</div>` : "";
    const left = opts.home
      ? `<button class="day-btn" data-open="day"><span class="cal" aria-hidden="true">📅</span><span><b>${snap.short}</b>${gen}</span></button>`
      : (opts.back ? `<button class="back" data-go="${opts.back}">‹ 返回</button>` : "");
    const mid = title
      ? `<h2 class="top-title">${title}</h2>`
      : `<h2 class="top-title top-title-empty" aria-hidden="true"></h2>`;
    const account = opts.account
      ? `<div class="top-actions"><button class="icon-btn" data-go="#/me">账户</button></div>`
      : `<div class="top-actions"></div>`;
    return `<div class="top"><div class="top-left">${left}</div>${mid}${account}</div>`;
  }

  function emptyBox(t) { return `<div class="empty">${t}</div>`; }
  function errorBox(t) {
    return `<div class="error-box">${t}<div style="margin-top:10px"><button class="btn primary" data-act="retry">重试</button></div></div>`;
  }

  function renderLogin() {
    $("#app").innerHTML = `
      <section class="login">
        <div class="login-card">
          <h1>资产看板</h1>
          <div class="sub">一页九节点 · 异常置顶 · 点进去才是明细</div>
          <p class="form-error" id="loginError"></p>
          <label class="field">手机号
            <input id="phone" inputmode="numeric" maxlength="11" placeholder="11 位手机号" value="13800001000">
            <span class="err" id="phoneErr"></span>
          </label>
          <label class="field">密码
            <input id="pwd" type="password" placeholder="至少 6 位" value="123456">
            <span class="err" id="pwdErr"></span>
          </label>
          <button class="btn primary block" id="loginBtn">登录</button>
          <div class="demo-hint">
            演示：13800001000 · 密码 123456
          </div>
        </div>
      </section>`;
    $("#loginBtn").onclick = doLogin;
  }

  function doLogin() {
    const phone = $("#phone").value.trim();
    const pwd = $("#pwd").value;
    $("#phoneErr").textContent = "";
    $("#pwdErr").textContent = "";
    const box = $("#loginError");
    box.classList.remove("show");
    if (!/^1\d{10}$/.test(phone)) { $("#phoneErr").textContent = "请输入 11 位手机号"; return; }
    if (pwd.length < 6) { $("#pwdErr").textContent = "密码至少 6 位"; return; }
    const acc = M.ACCOUNTS.find((a) => a.phone === phone && a.password === pwd);
    if (!acc) { box.textContent = "账号或密码不正确"; box.classList.add("show"); return; }
    state.user = { ...acc };
    saveSession();
    go("#/home");
  }

  function overdueBarsHtml(bars, maxN) {
    const max = maxN || Math.max(bars[5], bars[7], bars[10], 1);
    return `<div class="od-bars" aria-hidden="true">
      ${[5, 7, 10].map((d) => {
        const n = bars[d] || 0;
        const h = Math.max(6, Math.round((n / max) * 36));
        return `<div class="od-col"><i style="height:${h}px"></i><em>≥${d}</em><b>${n}</b></div>`;
      }).join("")}
    </div>`;
  }

  function fmtQty(n, v) {
    if (v == null) return `<b>—</b>`;
    return n.kind === "material" ? `<b>${v}</b><small>万</small>` : `<b>${v}</b>`;
  }

  function nodeTableHtml(tab) {
    if (state.demoEmpty) return emptyBox("这一节点暂时没有记录");
    const abnormal = tab === "abnormal";
    const data = abnormal ? M.ABNORMAL_TRENDS : M.TRENDS;
    const last7 = (M.TRENDS.wip || []).slice(-7);
    const today = last7[last7.length - 1].date;
    const history = last7.slice(0, -1).reverse().map((p) => p.date);
    const head = `<div class="dt-row dt-head">
      <div class="dt-cell dt-node">节点</div>
      <div class="dt-cell dt-today">今日<small>${today}</small></div>
      ${history.map((d) => `<div class="dt-cell dt-day">${d}</div>`).join("")}
      <div class="dt-cell dt-trend">趋势</div>
    </div>`;
    const rows = M.NODES.map((n) => {
      const byDate = {};
      (data[n.id] || []).forEach((p) => { byDate[p.date] = p.v; });
      return `<div class="dt-row">
        <button type="button" class="dt-cell dt-node dt-node-link" data-go="#/node/${n.id}">${n.name}</button>
        <div class="dt-cell dt-today">${fmtQty(n, byDate[today])}</div>
        ${history.map((d) => `<div class="dt-cell dt-day">${fmtQty(n, byDate[d])}</div>`).join("")}
        <div class="dt-cell dt-trend">
          <button type="button" class="trend-fab" data-open="trend" data-node="${n.id}" data-dataset="${tab}" aria-label="${n.name} 多日趋势">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><polyline points="3,17 8,11 12,14 21,5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="5" r="1.8" fill="currentColor"/></svg>
          </button>
        </div>
      </div>`;
    }).join("");
    return `<div class="dt-wrap">${head}${rows}</div>`;
  }

  function renderHome() {
    const h = currentSnap();
    if (state.demoError) {
      $("#app").innerHTML = `${topBar("", { home: true, account: true })}<div class="page page-notab">${errorBox("主看板加载失败")}</div>`;
      return;
    }
    const nodeTab = state.pf.home.nodeTab === "abnormal" ? "abnormal" : "normal";
    const bars = h.overdueBars || { 5: 0, 7: 0, 10: 0 };
    const abnormalCards = `
      <div class="kpi-grid three home-kpi">
        <div class="card clickable" data-go="#/exceptions?type=overdue">
          <label>超期</label>
          <strong class="tone-yellow">${h.overdue}</strong>
          <div class="split">${bars[5] || 0} / ${bars[7] || 0} / ${bars[10] || 0}</div>
        </div>
        <div class="card clickable" data-go="#/exceptions?type=conflict">
          <label>多维冲突</label>
          <strong class="tone-red">${h.conflict}</strong>
          <div class="split">同一 SN 去重</div>
        </div>
        <div class="card clickable" data-go="#/exceptions?type=orphan">
          <label>归属缺失</label>
          <strong class="tone-red">${h.orphan}</strong>
          <div class="split">当前归属为空</div>
        </div>
      </div>
      <p class="section-legend" style="margin-top:8px">从环节剥离 · 超期 5/7/10 · 冲突已去重 · 点卡片查明细</p>`;
    $("#app").innerHTML = `
      ${topBar("", { home: true, account: true })}
      <div class="page page-notab">
        <div class="home-top">
          <div class="kpi-grid three home-kpi">
            <div class="card"><label>成品总数</label><strong>${h.finishedTotal} 块</strong></div>
            <div class="card clickable" data-go="#/exceptions"><label>异常</label><strong class="tone-red">${h.abnormal}</strong></div>
            <div class="card"><label>金额</label><strong>${money(h.amountTotal)}</strong></div>
          </div>
          <p class="section-legend">金额 = SN × 型号 × BOM 理论值</p>
        </div>
        <div class="section-title">九个节点（多日对比）</div>
        <div class="seg-tabs" role="tablist">
          <button type="button" class="seg ${nodeTab === "normal" ? "on" : ""}" data-act="node-tab" data-id="normal" role="tab">所有</button>
          <button type="button" class="seg ${nodeTab === "abnormal" ? "on" : ""}" data-act="node-tab" data-id="abnormal" role="tab">异常</button>
        </div>
        ${nodeTab === "abnormal" ? abnormalCards : ""}
        <p class="section-legend">${nodeTab === "abnormal" ? "每日未关闭异常数" : "每日在量"} · 点节点名下钻 · 左滑看更早日期</p>
        ${nodeTableHtml(nodeTab)}
      </div>`;
  }

  function renderSnList(id, rows, title, back, extra) {
    const f = state.pf.node || {};
    if (f.sn) rows = rows.filter((r) => r.sn.includes(f.sn));
    if (f.place) rows = rows.filter((r) => (r.place + (r.owner || "") + (r.lastOwner || "")).includes(f.place));
    if (state.demoEmpty) rows = [];
    const ownerLab = { warehouse: "仓库", cabinet: "电柜", rider: "小哥", maint: "运维", none: "无" };
    const list = rows.length ? rows.map((r) => {
      const bad = r.ownerType === "none";
      const last = r.lastOwner ? `<br>最近归属 ${r.lastOwner}（${r.lastOwnerAt || "90 天内"}）` : "";
      const transit = r.shipBy
        ? `<br>${r.shipBy} → ${r.arriveHint || "今天"} · 累计 ${r.transitDays} 天 · ${r.status || "在途"}`
        : "";
      return `<div class="row clickable" data-go="#/asset/${r.sn}">
        <div class="h"><b>${r.sn}</b><span class="pill ${bad ? "danger" : ""}">${ownerLab[r.ownerType] || r.ownerType}</span></div>
        <div class="d">${r.owner} · ${r.place} · ${r.model || ""} · ${money(r.amount)}${last}${transit}${r.idle != null && !r.shipBy ? "<br>静止 " + r.idle + " 天" : ""}</div>
      </div>`;
    }).join("") : emptyBox(f.sn ? "没有符合条件的记录" : "这一节点暂时没有记录");
    $("#app").innerHTML = `
      ${topBar(title, { back, account: true })}
      <div class="page page-notab">
        ${extra || ""}
        <div class="muted" style="margin:8px 2px">当前 ${rows.length} 条 · 本节点单位：块</div>
        <div class="list">${list}</div>
      </div>`;
  }

  function nodeHead(node, extraSplit) {
    return `<div class="card node-head">
      <div>
        <label>${node.name}</label>
        <strong>${node.kind === "material" ? node.primary : node.bat + " 块"}</strong>
        <div class="split">${extraSplit || node.split} · ${money(node.amount)}</div>
      </div>
      ${timeBtn(node.id)}
    </div>`;
  }

  function renderNode(id, city, siteId) {
    const node = M.NODES.find((n) => n.id === id);
    if (!node) { toast("节点不存在"); go("#/home"); return; }
    if (state.demoError) {
      $("#app").innerHTML = `${topBar(node.name, { back: "#/home", account: true })}<div class="page page-notab">${errorBox("节点明细加载失败")}</div>`;
      return;
    }
    const f = state.pf.node || {};

    if (id === "material") {
      let rows = M.MATERIALS.slice();
      if (f.place) rows = rows.filter((r) => (r.name + r.place).includes(f.place));
      if (state.demoEmpty) rows = [];
      const list = rows.length ? rows.map((r) => `
        <div class="row">
          <div class="h"><b>${r.name}</b><span class="pill">${r.id}</span></div>
          <div class="d">${r.qty} · ${money(r.amount)} · ${r.place}<br>关键件 · 不折成品 · 一期无批次追踪</div>
        </div>`).join("") : emptyBox("这一节点暂时没有记录");
      $("#app").innerHTML = `
        ${topBar("物料", { back: "#/home", account: true })}
        <div class="page page-notab">
          ${nodeHead(node, "工厂 · 关键件")}
          <div class="list" style="margin-top:8px">${list}</div>
        </div>`;
      return;
    }

    if (id === "wip") {
      if (!city) {
        const wos = state.demoEmpty ? [] : M.WORK_ORDERS.slice();
        const list = wos.length ? wos.map((w) => `
          <button class="stage-row" data-go="#/node/wip/${w.id}">
            <div><b>${w.id}</b><small>${w.line} · ${w.start} → ${w.end}</small></div>
            <div class="metric">${w.duration}<small>${w.bat} 块</small></div>
          </button>`).join("") : emptyBox("这一节点暂时没有记录");
        $("#app").innerHTML = `
          ${topBar("生产中", { back: "#/home", account: true })}
          <div class="page page-notab">
            ${nodeHead(node, "一厂一线 · 按工单时长")}
            <div class="muted" style="margin:8px 2px">开始到结束的持续时间，不是块数换算</div>
            <div class="funnel">${list}</div>
          </div>`;
        return;
      }
      renderSnList("wip", M.WIDE.filter((r) => r.node === "wip" && r.woId === city), city, "#/node/wip",
        `<div class="card"><label>${city}</label><strong>${(M.WORK_ORDERS.find((w) => w.id === city) || {}).duration || "—"}</strong><div class="split">东莞一线 · 工单时长</div></div>`);
      return;
    }

    if (id === "transit") {
      renderSnList("transit", M.WIDE.filter((r) => r.node === "transit"), "在途", "#/home",
        nodeHead(node, "发货截止日 → 今天"));
      return;
    }

    if (id === "orphan") {
      if (!city) {
        const rows = citiesByAsset("orphan").map((r) => {
          const n = (M.NODE_CITIES.orphan || {})[r.id] || 0;
          return `<button class="stage-row" data-go="#/node/orphan/${r.id}">
            <div><b>${r.name}</b><small>90 天最近归属</small></div>
            <div class="metric">${n} 块</div>
          </button>`;
        }).join("");
        $("#app").innerHTML = `
          ${topBar("无归属", { back: "#/home", account: true })}
          <div class="page page-notab">
            ${nodeHead(node, "城市按资产数降序 · 无 GPS")}
            <div class="muted" style="margin:8px 2px">先选城市。查找窗口 90 天最近归属，不做 GPS 展示</div>
            <div class="funnel">${state.demoEmpty ? emptyBox("这一节点暂时没有记录") : rows}</div>
          </div>`;
        return;
      }
      renderSnList("orphan", M.WIDE.filter((r) => r.node === "orphan" && r.city === city), "无归属 · " + cityName(city), "#/node/orphan",
        `<div class="card"><label>无归属 · ${cityName(city)}</label><strong>${(M.NODE_CITIES.orphan || {})[city] || 0} 块</strong><div class="split">90 天最近归属定城市 · 无 GPS</div></div>`);
      return;
    }

    if (M.MULTI[id]) {
      const meta = M.MULTI[id];
      if (!city) {
        const rows = citiesByAsset(id).map((r) => {
          const n = (M.NODE_CITIES[id] || {})[r.id] || 0;
          const sites = M.SITES.filter((s) => s.node === id && s.city === r.id).length;
          return `<button class="stage-row" data-go="#/node/${id}/${r.id}">
            <div><b>${r.name}</b><small>${sites} ${meta.unit}</small></div>
            <div class="metric">${n} 块</div>
          </button>`;
        }).join("");
        $("#app").innerHTML = `
          ${topBar(node.name, { back: "#/home", account: true })}
          <div class="page page-notab">
            ${nodeHead(node, "城市按资产数降序")}
            <div class="muted" style="margin:8px 2px">先选城市，再看${meta.siteLabel}。无省级汇总</div>
            <div class="funnel">${state.demoEmpty ? emptyBox("这一节点暂时没有记录") : rows}</div>
          </div>`;
        return;
      }
      if (!siteId) {
        let sites = M.SITES.filter((s) => s.node === id && s.city === city);
        if (f.place) sites = sites.filter((s) => s.name.includes(f.place));
        if (state.demoEmpty) sites = [];
        const list = sites.length ? sites.map((s) => `
          <button class="stage-row" data-go="#/node/${id}/${city}/${s.id}">
            <div><b>${s.name}</b><small>${cityName(city)}</small></div>
            <div class="metric">${s.bat} 块</div>
          </button>`).join("") : emptyBox("这一城市暂时没有记录");
        $("#app").innerHTML = `
          ${topBar(node.name + " · " + cityName(city), { back: `#/node/${id}`, account: true })}
          <div class="page page-notab">
            <div class="card"><label>${cityName(city)}</label><strong>${(M.NODE_CITIES[id] || {})[city] || 0} 块</strong><div class="split">${sites.length} ${meta.unit}</div></div>
            <div class="funnel" style="margin-top:8px">${list}</div>
          </div>`;
        return;
      }
      const site = M.SITES.find((s) => s.id === siteId);
      const extra = `<div class="card"><label>${site ? site.name : siteId}</label><strong>${site ? site.bat : 0} 块</strong><div class="split">${cityName(city)}</div></div>`;
      renderSnList(id, M.WIDE.filter((r) => r.node === id && r.siteId === siteId), (site ? site.name : node.name), `#/node/${id}/${city}`, extra);
      return;
    }

    renderSnList(id, M.WIDE.filter((r) => r.node === id), node.name, "#/home", nodeHead(node));
  }

  function uniqueConflicts(rows) {
    const seen = new Set();
    return rows.filter((r) => {
      if (r.type !== "conflict") return true;
      if (seen.has(r.sn)) return false;
      seen.add(r.sn);
      return true;
    });
  }

  function renderExceptions() {
    if (state.demoError) {
      $("#app").innerHTML = `${topBar("异常", { back: "#/home", account: true })}<div class="page page-notab">${errorBox("异常加载失败")}</div>`;
      return;
    }
    const f = state.pf.exceptions || {};
    const type = f.type || state.params.type || "all";
    const idle = f.idle || "5";
    let rows = uniqueConflicts(state.exceptions.slice());
    if (type !== "all") rows = rows.filter((r) => r.type === type);
    if (f.status && f.status !== "all") rows = rows.filter((r) => r.status === f.status);
    if (type === "overdue" || type === "all") {
      const min = Number(idle) || 5;
      rows = rows.filter((r) => r.type !== "overdue" || r.idle >= min);
    }
    if (state.demoEmpty) rows = [];
    const list = rows.length ? rows.map((r) => {
      const typeClass = r.status === "closed" ? "closed" : r.type;
      return `<div class="ex-row">
        <span class="id">${r.id}</span>
        <span class="sn">${r.sn}</span>
        <span class="type ${typeClass}">${r.typeName}</span>
        <span class="place">${r.place}</span>
        <span class="time">${r.found}</span>
        ${r.sn ? `<button class="trail" data-go="#/asset/${r.sn}">轨迹</button>` : `<span></span>`}
      </div>`;
    }).join("") : emptyBox("当前没有这类异常");
    const title = type === "conflict" ? "多维冲突" : type === "orphan" ? "归属缺失" : type === "overdue" ? "超期" : "异常";
    const snap = currentSnap();
    const overdueExtra = (type === "overdue" || type === "all")
      ? `<div class="card" style="margin-bottom:8px">
          <label>超期分布</label>
          ${overdueBarsHtml(snap.overdueBars || { 5: 0, 7: 0, 10: 0 })}
          <div class="filters-inline" style="margin:8px 0 0">
            ${[["5", "≥5 天"], ["7", "≥7 天"], ["10", "≥10 天"]].map(([id, lab]) =>
              `<button class="chip ${idle === id ? "on" : ""}" data-act="ex-idle" data-id="${id}">${lab}</button>`).join("")}
          </div>
        </div>`
      : "";
    $("#app").innerHTML = `
      ${topBar(title, { back: "#/home", account: true })}
      <div class="page page-notab">
        <div class="filters-inline">
          ${[["all", "全部"], ["overdue", "超期"], ["conflict", "多维冲突"], ["orphan", "归属缺失"]].map(([id, lab]) =>
            `<button class="chip ${type === id ? "on" : ""}" data-act="ex-type" data-id="${id}">${lab}</button>`).join("")}
        </div>
        ${overdueExtra}
        <div class="list ex-list">${list}</div>
      </div>`;
  }

  function renderAsset(sn) {
    const rows = M.WIDE.filter((a) => a.sn === sn);
    const trail = M.TRAILS[sn];
    if (!rows.length && !trail) {
      $("#app").innerHTML = `${topBar("电池轨迹", { back: "#/home", account: true })}<div class="page page-notab">
        <div class="filters-inline"><input id="snQ" class="chip" style="flex:1;height:32px;border-radius:8px" placeholder="输入 SN"><button class="chip on" data-act="search-sn">查看</button></div>
        ${emptyBox("没有这个电池编号")}
      </div>`;
      return;
    }
    if (state.demoError) {
      $("#app").innerHTML = `${topBar(sn, { back: "#/home", account: true })}<div class="page page-notab">${errorBox("轨迹加载失败")}</div>`;
      return;
    }
    const events = (trail || []).slice();
    const tl = (events.length ? events : [{ at: "—", event: "赋码", from: "—", to: "—", doc: "—" }]).map((e) =>
      `<div class="tl"><div class="dot"></div><div class="body"><b>${e.event}</b><div class="d">${e.at} · ${e.from} → ${e.to}<br>${e.doc}</div></div></div>`
    ).join("");
    const nodes = rows.map((r) => nodeName(r.node)).join(" + ");
    const conflict = rows.length > 1;
    const row = rows[0] || {};
    $("#app").innerHTML = `
      ${topBar(sn, { back: "#/home", account: true })}
      <div class="page page-notab">
        <div class="card">
          <label>${nodes || ""} · ${row.model || ""}</label>
          <div class="d">${money(row.amount)} · BOM 理论值${conflict ? " · 多维冲突" : ""}</div>
        </div>
        <div class="section-title">轨迹</div>
        <div class="card"><div class="timeline">${tl}</div></div>
      </div>`;
  }

  function renderMe() {
    $("#app").innerHTML = `
      ${topBar("账户", { back: "#/home", noMeta: true })}
      <div class="page page-notab">
        <div class="card">
          <strong style="font-size:18px">${state.user.name}</strong>
          <div class="split">${state.user.phone}</div>
        </div>
        <div class="section-title">演示</div>
        <div class="card">
          <label class="me-item">演示空态 <input type="checkbox" id="emptySw" ${state.demoEmpty ? "checked" : ""}></label>
          <label class="me-item">演示错态 <input type="checkbox" id="errorSw" ${state.demoError ? "checked" : ""}></label>
        </div>
        <button class="btn block" style="margin-top:16px" data-act="logout">退出登录</button>
      </div>`;
    $("#emptySw").onchange = () => { state.demoEmpty = $("#emptySw").checked; saveSession(); toast(state.demoEmpty ? "空态已开" : "空态已关"); };
    $("#errorSw").onchange = () => { state.demoError = $("#errorSw").checked; saveSession(); toast(state.demoError ? "错态已开" : "错态已关"); };
  }

  function closeOverlays() { $("#overlay").innerHTML = ""; }
  function wireOverlayClose() {
    $$("[data-act='close-sheet']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => { e.stopPropagation(); closeOverlays(); });
    });
  }
  function openSheet(title, html) {
    $("#overlay").innerHTML = `<div class="sheet-mask" data-act="close-sheet"><div class="sheet" onclick="event.stopPropagation()"><h3>${title}</h3>${html}</div></div>`;
    wireOverlayClose();
  }

  function trendSvg(points, pinToday) {
    const w = Math.max(320, points.length * 26), h = 140, pad = 18, labelH = 18;
    const chartH = h - labelH;
    const vs = points.map((p) => p.v);
    const min = Math.min.apply(null, vs);
    const max = Math.max.apply(null, vs);
    const span = max - min || 1;
    const xs = points.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(points.length - 1, 1));
    const ys = points.map((p) => chartH - pad + 6 - ((p.v - min) / span) * (chartH - pad * 2));
    const d = xs.map((x, i) => (i ? "L" : "M") + x.toFixed(1) + "," + ys[i].toFixed(1)).join(" ");
    const dots = points.map((p, i) => {
      const pin = pinToday && p.today;
      return `<g class="trend-dot" data-act="trend-dot" data-i="${i}">
        <circle class="hit" cx="${xs[i]}" cy="${ys[i]}" r="14" fill="transparent"></circle>
        <circle class="mark" cx="${xs[i]}" cy="${ys[i]}" r="${pin ? 5 : 3.2}" fill="${pin ? "#0d9488" : "#657383"}"></circle>
      </g>`;
    }).join("");
    const tickCount = Math.min(6, points.length);
    const labels = [];
    for (let i = 0; i < tickCount; i++) {
      const idx = tickCount === 1 ? 0 : Math.round((i * (points.length - 1)) / (tickCount - 1));
      labels.push(`<text x="${xs[idx].toFixed(1)}" y="${h - 4}" font-size="9" fill="#657383" text-anchor="middle">${points[idx].date}</text>`);
    }
    return `<svg class="trend-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" data-xs="${xs.map((x) => x.toFixed(1)).join(",")}">${d ? `<path d="${d}" fill="none" stroke="#0d9488" stroke-width="2"/>` : ""}${dots}${labels.join("")}</svg>`;
  }

  function trendMonthsOf(pts) {
    const out = [];
    pts.forEach((p) => { const m = p.ymd.slice(0, 7); if (!out.includes(m)) out.push(m); });
    return out;
  }
  function monthLabel(m) { const [y, mm] = m.split("-"); return y + "年" + Number(mm) + "月"; }

  function paintTrend() {
    const id = state.pf.trend.node;
    const node = M.NODES.find((n) => n.id === id);
    const abnormal = state.pf.trend.dataset === "abnormal";
    const full = ((abnormal ? M.ABNORMAL_TRENDS : M.TRENDS)[id] || []).slice();
    if (!node || !full.length) { toast("没有趋势"); return; }
    const pin = !!state.pf.trend.pinToday;
    const mode = state.pf.trend.mode || "line";
    const range = state.pf.trend.range || "7";
    const months = trendMonthsOf(full);
    if (!state.pf.trend.month || months.indexOf(state.pf.trend.month) < 0) {
      state.pf.trend.month = months[months.length - 1];
    }
    let pts = full;
    if (range === "7") pts = full.slice(-7);
    else if (range === "30") pts = full.slice(-30);
    else if (range === "month") pts = full.filter((p) => p.ymd.indexOf(state.pf.trend.month) === 0);
    if (!pts.length) pts = full.slice(-7);
    const table = `<div class="trend-table-wrap"><table class="trend-table"><tr>${pts.map((p) =>
      `<th class="${pin && p.today ? "pin" : ""}">${p.date}${pin && p.today ? "<br>钉" : ""}</th>`).join("")}</tr><tr>${pts.map((p) =>
      `<td class="${pin && p.today ? "pin" : ""}">${p.v}</td>`).join("")}</tr></table></div>`;
    const body = mode === "table"
      ? table
      : `<div class="trend-tip" id="trendTip">点折线上的圆点，看当日数据</div><div class="trend-scroll">${trendSvg(pts, pin)}</div>`;
    const monthOpts = (range === "month" ? "" : `<option value="" selected disabled>按月</option>`) +
      months.map((m) => `<option value="${m}" ${range === "month" && state.pf.trend.month === m ? "selected" : ""}>${monthLabel(m)}</option>`).join("");
    const html = `
      <div class="filters-inline">
        <button class="chip ${range === "7" ? "on" : ""}" data-act="trend-range" data-id="7">近7日</button>
        <button class="chip ${range === "30" ? "on" : ""}" data-act="trend-range" data-id="30">近30日</button>
        <select class="chip chip-select ${range === "month" ? "on" : ""}" id="trendMonth" aria-label="选择月份">${monthOpts}</select>
      </div>
      <div class="filters-inline">
        <button class="chip ${mode === "line" ? "on" : ""}" data-act="trend-mode" data-id="line">折线</button>
        <button class="chip ${mode === "table" ? "on" : ""}" data-act="trend-mode" data-id="table">表</button>
        <button class="chip ${pin ? "on" : ""}" data-act="trend-pin">钉住当天对比</button>
      </div>
      <p class="section-legend">${pts[0].ymd} ~ ${pts[pts.length - 1].ymd} · 共 ${pts.length} 天</p>
      ${body}
      <button class="btn ghost block" style="margin-top:12px" data-act="close-sheet">关闭</button>`;
    openSheet((node.name || "") + (abnormal ? " · 异常趋势" : " · 时间趋势"), html);
    $$("[data-act='trend-mode']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.pf.trend.mode = el.getAttribute("data-id");
        paintTrend();
      });
    });
    $$("[data-act='trend-pin']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.pf.trend.pinToday = !state.pf.trend.pinToday;
        paintTrend();
      });
    });
    $$("[data-act='trend-range']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.pf.trend.range = el.getAttribute("data-id");
        state.pf.trend.pick = null;
        paintTrend();
      });
    });
    const monthSel = $("#trendMonth", $("#overlay"));
    if (monthSel) monthSel.addEventListener("change", (e) => {
      e.stopPropagation();
      if (monthSel.value) {
        state.pf.trend.range = "month";
        state.pf.trend.month = monthSel.value;
        state.pf.trend.pick = null;
        paintTrend();
      }
    });
    const scroller = $(".trend-scroll", $("#overlay"));
    if (scroller) scroller.scrollLeft = scroller.scrollWidth;
    if (mode !== "table") bindTrendDots(pts, node);
  }

  function bindTrendDots(pts, node) {
    const root = $("#overlay");
    const tip = $("#trendTip", root);
    const unit = state.pf.trend.dataset === "abnormal" ? "条" : (node.kind === "material" ? "万" : "块");
    function paintTip(i) {
      const p = pts[i];
      if (!p || !tip) return;
      state.pf.trend.pick = i;
      tip.innerHTML = `<span>${p.ymd}</span><b>${p.v}</b><span>${unit}</span>`;
      tip.classList.add("on");
      $$(".trend-dot", root).forEach((g) => g.classList.toggle("on", Number(g.getAttribute("data-i")) === i));
    }
    $$("[data-act='trend-dot']", root).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        paintTip(Number(el.getAttribute("data-i")));
      });
    });
    const svg = $(".trend-svg", root);
    if (svg) {
      svg.addEventListener("click", (e) => {
        if (e.target.closest("[data-act='trend-dot']")) return;
        e.stopPropagation();
        const xs = (svg.getAttribute("data-xs") || "").split(",").map(Number);
        if (!xs.length) return;
        const rect = svg.getBoundingClientRect();
        const vb = svg.viewBox.baseVal;
        const x = ((e.clientX - rect.left) / rect.width) * vb.width;
        let best = 0, bestD = Infinity;
        xs.forEach((cx, i) => {
          const d = Math.abs(cx - x);
          if (d < bestD) { bestD = d; best = i; }
        });
        paintTip(best);
      });
    }
    const pick = state.pf.trend.pick;
    if (pick != null && pts[pick]) paintTip(pick);
  }
  function openTrend(nodeId, dataset) {
    state.pf.trend.node = nodeId;
    state.pf.trend.dataset = dataset === "abnormal" ? "abnormal" : "normal";
    state.pf.trend.pick = null;
    paintTrend();
  }

  function ymdParts(date) {
    const [y, m, d] = String(date).split("-").map(Number);
    return { y, m, d };
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function toYmd(y, m, d) { return y + "-" + pad2(m) + "-" + pad2(d); }
  function snapByDate(ymd) { return M.SNAPSHOTS.find((s) => s.date === ymd); }
  function todayYmd() { return (M.SNAPSHOTS.find((s) => s.id === "today") || M.SNAPSHOTS[0]).date; }
  function shiftCalMonth(dir) {
    let { y, m } = state.calMonth || ymdParts(currentSnap().date);
    m += dir;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    state.calMonth = { y, m };
  }
  function calGridHtml(y, m) {
    const firstDow = new Date(y, m - 1, 1).getDay();
    const days = new Date(y, m, 0).getDate();
    const today = todayYmd();
    const selected = currentSnap();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(`<span class="cal-cell is-pad"></span>`);
    for (let d = 1; d <= days; d++) {
      const ymd = toYmd(y, m, d);
      const hit = snapByDate(ymd);
      const isToday = ymd === today;
      const isSelected = !!(hit && hit.id === selected.id);
      const cls = [
        "cal-cell",
        hit ? "has-snap" : "no-snap",
        isToday ? "is-today" : "",
        isSelected ? "is-selected" : "",
        hit ? "" : "is-disabled",
      ].filter(Boolean).join(" ");
      const attrs = hit
        ? `data-act="pick-day" data-id="${hit.id}"`
        : `disabled aria-disabled="true"`;
      cells.push(`<button type="button" class="${cls}" ${attrs}><span class="num">${d}</span></button>`);
    }
    return cells.join("");
  }
  function paintDaySheet() {
    if (!state.calMonth) state.calMonth = ymdParts(currentSnap().date);
    const { y, m } = state.calMonth;
    const snap = currentSnap();
    const foot = snap.id === "today" && snap.generatedAt
      ? `当天 · 数据生成 ${snap.date} ${snap.generatedAt}`
      : (snap.id === "today" ? "当天" : snap.date);
    const week = ["日", "一", "二", "三", "四", "五", "六"]
      .map((w) => `<span>${w}</span>`).join("");
    const html = `
      <div class="cal">
        <div class="cal-nav">
          <button type="button" class="cal-nav-btn" data-act="cal-shift" data-dir="-1" aria-label="上一月">‹</button>
          <div class="cal-ym">${y}年${m}月</div>
          <button type="button" class="cal-nav-btn" data-act="cal-shift" data-dir="1" aria-label="下一月">›</button>
        </div>
        <div class="cal-week">${week}</div>
        <div class="cal-grid">${calGridHtml(y, m)}</div>
        <div class="cal-foot">${foot}</div>
      </div>
      <button class="btn ghost block" style="margin-top:12px" data-act="close-sheet">取消</button>`;
    openSheet("选择自然日", html);
    $$("[data-act='cal-shift']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        shiftCalMonth(Number(el.getAttribute("data-dir")));
        paintDaySheet();
      });
    });
    $$("[data-act='pick-day']", $("#overlay")).forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        state.pf.home.day = el.getAttribute("data-id");
        closeOverlays();
        toast(state.pf.home.day === "today" ? "已切到当天" : "已切到 " + currentSnap().short);
        render();
      });
    });
  }
  function openDay() {
    state.calMonth = ymdParts(currentSnap().date);
    paintDaySheet();
  }

  function guard(route) {
    if (!state.user && route !== "login") { location.hash = "#/login"; return false; }
    if (state.user && route === "login") { location.hash = "#/home"; return false; }
    return true;
  }

  function render() {
    loadSession();
    const { parts, query } = parseHash();
    state.params = query;
    const first = parts[0] || "login";
    if (["mfg", "ops", "alerts", "chain", "risk", "detail"].includes(first)) {
      if (state.user) { toast("已回到主看板"); location.hash = "#/home"; }
      else location.hash = "#/login";
      return;
    }
    if (first === "node") {
      state.route = "node";
      state.params.node = parts[1];
      state.params.city = parts[2] || "";
      state.params.site = parts[3] || "";
      if (!guard("node")) return;
      renderNode(parts[1], parts[2], parts[3]);
    } else if (first === "exceptions") {
      state.route = "exceptions";
      if (!guard("exceptions")) return;
      state.pf.exceptions.type = query.type || "all";
      renderExceptions();
    } else if (first === "asset") {
      state.route = "asset";
      if (!guard("asset")) return;
      renderAsset(parts[1]);
    } else if (first === "me") {
      state.route = "me";
      if (!guard("me")) return;
      renderMe();
    } else if (first === "home") {
      state.route = "home";
      if (!guard("home")) return;
      renderHome();
    } else {
      state.route = "login";
      if (!guard("login")) return;
      renderLogin();
    }
  }

  function onClick(e) {
    const openEl = e.target.closest("[data-open]");
    if (openEl) {
      const kind = openEl.getAttribute("data-open");
      if (kind === "day") openDay();
      if (kind === "trend") openTrend(openEl.getAttribute("data-node"), openEl.getAttribute("data-dataset"));
      return;
    }
    const goEl = e.target.closest("[data-go]");
    if (goEl) { go(goEl.getAttribute("data-go")); return; }
    const actEl = e.target.closest("[data-act]");
    if (!actEl) return;
    const act = actEl.getAttribute("data-act");
    if (act === "trend-dot") return;
    if (act === "close-sheet") closeOverlays();
    if (act === "logout") { state.user = null; sessionStorage.removeItem("asset-board-user"); go("#/login"); }
    if (act === "retry") { state.demoError = false; saveSession(); render(); }
    if (act === "search-sn") { const q = $("#snQ").value.trim(); if (q) go("#/asset/" + q); }
    if (act === "ex-type") {
      const id = actEl.getAttribute("data-id");
      state.pf.exceptions.type = id;
      go(id === "all" ? "#/exceptions" : "#/exceptions?type=" + id);
    }
    if (act === "ex-idle") {
      state.pf.exceptions.idle = actEl.getAttribute("data-id");
      renderExceptions();
    }
    if (act === "node-tab") {
      state.pf.home.nodeTab = actEl.getAttribute("data-id") === "abnormal" ? "abnormal" : "normal";
      renderHome();
      return;
    }
    if (act === "cal-shift") {
      shiftCalMonth(Number(actEl.getAttribute("data-dir")));
      paintDaySheet();
      return;
    }
    if (act === "pick-day") {
      state.pf.home.day = actEl.getAttribute("data-id");
      closeOverlays();
      toast(state.pf.home.day === "today" ? "已切到当天" : "已切到 " + currentSnap().short);
      render();
    }
  }

  document.addEventListener("click", onClick);
  window.addEventListener("hashchange", render);
  loadSession();
  if (!location.hash) location.hash = state.user ? "#/home" : "#/login";
  else render();
})();

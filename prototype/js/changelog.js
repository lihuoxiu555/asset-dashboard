/**
 * 资产看板 · 更新记录（桌面左下角，新条目置顶）
 */
(function () {
  const ENTRIES = [
    {
      version: "V0.2",
      date: "2026-09-24",
      title: "异常口径按环节裁剪",
      items: [
        "物料：仅展示 BOM 单核心物料；异常 Tab 不可点",
        "生产中：列表为生产任务单；无多维冲突 / 归属缺失",
        "工厂成品仓：读取库存信息，不拆 SN",
        "在途：只到本层，不再下钻 SN",
        "除无归属外，各环节移除「归属缺失」指标",
        "运营域 / 小哥 / 运维无归属缺失；无归属无多维冲突",
      ],
    },
    {
      version: "V0.1",
      date: "2026-09-24",
      title: "下钻只到业务需要的一层",
      items: [
        "小哥使用中、运维持有：只到城市",
        "前置仓：只到仓库列表",
        "运营域电柜中：只到站点列表",
        "生产中：只到生产任务单",
      ],
    },
  ];

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mount() {
    const root = document.getElementById("changelog-root");
    const pill = document.getElementById("changelog-latest");
    if (!root) return;
    if (pill && ENTRIES[0]) pill.textContent = ENTRIES[0].version;
    root.innerHTML = ENTRIES.map((e) => {
      const lis = e.items.map((t) => `<li>${escapeHtml(t)}</li>`).join("");
      return `<article class="changelog-item">
        <header class="changelog-hd">
          <span class="changelog-ver">${escapeHtml(e.version)}</span>
          <time class="changelog-date">${escapeHtml(e.date)}</time>
        </header>
        <h3 class="changelog-title">${escapeHtml(e.title)}</h3>
        <ul class="changelog-ul">${lis}</ul>
      </article>`;
    }).join("");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();

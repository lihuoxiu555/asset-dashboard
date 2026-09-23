window.AssetBoardMock = (function () {
  const ACCOUNTS = [
    { phone: "13800001000", password: "123456", name: "李某" },
  ];

  const CITIES = [
    { id: "sz", name: "深圳" },
    { id: "hz", name: "杭州" },
    { id: "sh", name: "上海" },
  ];

  const MULTI = {
    front: { unit: "仓", siteLabel: "前置仓" },
    cabinet: { unit: "柜", siteLabel: "电柜" },
    rider: { unit: "人", siteLabel: "小哥" },
    maint: { unit: "人", siteLabel: "运维" },
  };

  const NODE_CITIES = {
    front: { sz: 180, hz: 70, sh: 40 },
    cabinet: { sz: 920, hz: 410, sh: 350 },
    rider: { sz: 180, hz: 140, sh: 100 },
    maint: { sz: 16, hz: 12, sh: 8 },
    orphan: { sz: 8, hz: 3, sh: 3 },
  };

  const SITES = [
    { id: "wh-sz-ns", node: "front", city: "sz", name: "深圳南山前置仓", bat: 110 },
    { id: "wh-sz-ft", node: "front", city: "sz", name: "深圳福田前置仓", bat: 70 },
    { id: "wh-hz-bj", node: "front", city: "hz", name: "杭州滨江前置仓", bat: 70 },
    { id: "wh-sh-pd", node: "front", city: "sh", name: "上海浦东前置仓", bat: 40 },
    { id: "cab-ns-12", node: "cabinet", city: "sz", name: "南山站 12 柜", bat: 520 },
    { id: "cab-ft-3", node: "cabinet", city: "sz", name: "福田站 3 柜", bat: 400 },
    { id: "cab-bj-1", node: "cabinet", city: "hz", name: "滨江站 1 柜", bat: 410 },
    { id: "cab-pd-8", node: "cabinet", city: "sh", name: "浦东站 8 柜", bat: 350 },
    { id: "rider-sz-1", node: "rider", city: "sz", name: "骑手 137****6602", bat: 100 },
    { id: "rider-sz-2", node: "rider", city: "sz", name: "骑手 136****4418", bat: 80 },
    { id: "rider-hz-1", node: "rider", city: "hz", name: "骑手 138****2210", bat: 140 },
    { id: "rider-sh-1", node: "rider", city: "sh", name: "骑手 139****8801", bat: 60 },
    { id: "rider-sh-2", node: "rider", city: "sh", name: "骑手 135****9022", bat: 40 },
    { id: "maint-sz-1", node: "maint", city: "sz", name: "运维-周班", bat: 10 },
    { id: "maint-sz-2", node: "maint", city: "sz", name: "运维-林班", bat: 6 },
    { id: "maint-hz-1", node: "maint", city: "hz", name: "运维-吴班", bat: 12 },
    { id: "maint-sh-1", node: "maint", city: "sh", name: "运维-陈班", bat: 8 },
  ];

  const NODES = [
    { id: "material", name: "物料", kind: "material", primary: "18.60 万颗", split: "关键件 · 不折成品 · 无批次", amount: 86.0, exceptions: 0 },
    { id: "wip", name: "生产中", kind: "battery", bat: 86, wo: 2, split: "一厂一线 · 工单时长", amount: 43.0, exceptions: 1 },
    { id: "factory", name: "工厂成品仓", kind: "battery", bat: 210, split: "工厂", amount: 105.0, exceptions: 1 },
    { id: "transit", name: "在途", kind: "battery", bat: 80, split: "起止日 · 累计天数", amount: 40.0, exceptions: 2 },
    { id: "front", name: "前置仓", kind: "battery", multi: true, bat: 290, split: "多仓 · 下钻看城市", amount: 145.0, exceptions: 3 },
    { id: "cabinet", name: "运营域电柜中", kind: "battery", multi: true, bat: 1680, split: "多柜 · 下钻看城市", amount: 840.0, exceptions: 4 },
    { id: "rider", name: "小哥使用中", kind: "battery", multi: true, bat: 420, split: "多人 · 下钻看城市", amount: 210.0, exceptions: 3 },
    { id: "maint", name: "运维持有", kind: "battery", multi: true, bat: 36, split: "多人 · 下钻看城市", amount: 18.0, exceptions: 2 },
    { id: "orphan", name: "无归属", kind: "battery", multi: true, bat: 14, split: "90 天最近归属 · 无 GPS", amount: 7.0, exceptions: 14 },
  ];

  const SNAPSHOTS = [
    { id: "today", date: "2026-09-23", short: "当天 09-23", generatedAt: "09:22", finishedTotal: 2816, normal: 2755, abnormal: 61, amountTotal: 1407.0, conflict: 3, orphan: 14, overdue: 47, overdueBars: { 5: 47, 7: 28, 10: 12 } },
    { id: "2026-09-22", date: "2026-09-22", short: "09-22", finishedTotal: 2788, normal: 2733, abnormal: 55, amountTotal: 1393.0, conflict: 2, orphan: 11, overdue: 44, overdueBars: { 5: 44, 7: 26, 10: 11 } },
    { id: "2026-09-21", date: "2026-09-21", short: "09-21", finishedTotal: 2740, normal: 2692, abnormal: 48, amountTotal: 1369.0, conflict: 2, orphan: 9, overdue: 40, overdueBars: { 5: 40, 7: 24, 10: 10 } },
  ];

  const HOME = SNAPSHOTS[0];

  const MATERIALS = [
    { id: "MAT-21700", name: "电芯-21700", qty: "18.60 万颗", amount: 72.0, place: "东莞物料仓" },
    { id: "MAT-CAB", name: "柜体结构件", qty: "72 套", amount: 9.6, place: "东莞物料仓" },
    { id: "MAT-BMS", name: "保护板-V3", qty: "4200 片", amount: 4.4, place: "东莞物料仓" },
  ];

  const WORK_ORDERS = [
    { id: "WO-0920-033", line: "东莞一线", start: "2026-09-16 10:00", end: "进行中", duration: "7 天 2 时", bat: 40 },
    { id: "WO-0922-011", line: "东莞一线", start: "2026-09-22 08:00", end: "进行中", duration: "1 天 1 时", bat: 46 },
  ];

  const TRENDS = {
    material: [
      { date: "09-17", v: 17.8 }, { date: "09-18", v: 17.9 }, { date: "09-19", v: 18.1 },
      { date: "09-20", v: 18.1 }, { date: "09-21", v: 18.2 }, { date: "09-22", v: 18.4 }, { date: "09-23", v: 18.6, today: true },
    ],
    wip: [
      { date: "09-17", v: 70 }, { date: "09-18", v: 72 }, { date: "09-19", v: 74 },
      { date: "09-20", v: 76 }, { date: "09-21", v: 80 }, { date: "09-22", v: 82 }, { date: "09-23", v: 86, today: true },
    ],
    factory: [
      { date: "09-17", v: 188 }, { date: "09-18", v: 190 }, { date: "09-19", v: 194 },
      { date: "09-20", v: 196 }, { date: "09-21", v: 198 }, { date: "09-22", v: 204 }, { date: "09-23", v: 210, today: true },
    ],
    transit: [
      { date: "09-17", v: 68 }, { date: "09-18", v: 70 }, { date: "09-19", v: 71 },
      { date: "09-20", v: 72 }, { date: "09-21", v: 74 }, { date: "09-22", v: 76 }, { date: "09-23", v: 80, today: true },
    ],
    front: [
      { date: "09-17", v: 310 }, { date: "09-18", v: 308 }, { date: "09-19", v: 306 },
      { date: "09-20", v: 304 }, { date: "09-21", v: 302 }, { date: "09-22", v: 296 }, { date: "09-23", v: 290, today: true },
    ],
    cabinet: [
      { date: "09-17", v: 1640 }, { date: "09-18", v: 1648 }, { date: "09-19", v: 1652 },
      { date: "09-20", v: 1658 }, { date: "09-21", v: 1662 }, { date: "09-22", v: 1670 }, { date: "09-23", v: 1680, today: true },
    ],
    rider: [
      { date: "09-17", v: 396 }, { date: "09-18", v: 400 }, { date: "09-19", v: 402 },
      { date: "09-20", v: 404 }, { date: "09-21", v: 408 }, { date: "09-22", v: 414 }, { date: "09-23", v: 420, today: true },
    ],
    maint: [
      { date: "09-17", v: 28 }, { date: "09-18", v: 28 }, { date: "09-19", v: 29 },
      { date: "09-20", v: 30 }, { date: "09-21", v: 30 }, { date: "09-22", v: 33 }, { date: "09-23", v: 36, today: true },
    ],
    orphan: [
      { date: "09-17", v: 8 }, { date: "09-18", v: 8 }, { date: "09-19", v: 9 },
      { date: "09-20", v: 10 }, { date: "09-21", v: 11 }, { date: "09-22", v: 12 }, { date: "09-23", v: 14, today: true },
    ],
  };

  const WIDE = [
    { sn: "BAT09A12200", node: "wip", woId: "WO-0920-033", ownerType: "warehouse", owner: "东莞工厂", place: "东莞一线", model: "B48", amount: 0.50 },
    { sn: "BAT09A12210", node: "wip", woId: "WO-0922-011", ownerType: "warehouse", owner: "东莞工厂", place: "东莞一线", model: "B48", amount: 0.50 },
    { sn: "BAT09A11008", node: "factory", ownerType: "warehouse", owner: "东莞成品仓", place: "东莞成品仓", model: "B48", amount: 0.50, idle: 1 },
    { sn: "BAT09A18001", node: "front", ownerType: "warehouse", owner: "深圳南山前置仓", place: "深圳南山前置仓", city: "sz", siteId: "wh-sz-ns", model: "B48", amount: 0.50, idle: 1.5 },
    { sn: "BAT09A14002", node: "front", ownerType: "cabinet", owner: "福田站 3 柜", place: "深圳南山前置仓", city: "sz", siteId: "wh-sz-ns", model: "B48", amount: 0.50, idle: 6 },
    { sn: "BAT09A18110", node: "front", ownerType: "warehouse", owner: "深圳福田前置仓", place: "深圳福田前置仓", city: "sz", siteId: "wh-sz-ft", model: "B48", amount: 0.50, idle: 2 },
    { sn: "BAT09A15501", node: "front", ownerType: "warehouse", owner: "杭州滨江前置仓", place: "杭州滨江前置仓", city: "hz", siteId: "wh-hz-bj", model: "B48", amount: 0.50, idle: 6 },
    { sn: "BAT09A15580", node: "front", ownerType: "warehouse", owner: "上海浦东前置仓", place: "上海浦东前置仓", city: "sh", siteId: "wh-sh-pd", model: "B48", amount: 0.50, idle: 1 },
    { sn: "BAT09A17660", node: "transit", ownerType: "none", owner: "—", place: "东莞→南山", shipBy: "2026-09-18", arriveHint: "今天", transitDays: 5, status: "在途", model: "B48", amount: 0.50 },
    { sn: "BAT09A08812", node: "transit", ownerType: "none", owner: "—", place: "东莞→浦东", shipBy: "2026-09-16", arriveHint: "今天", transitDays: 7, status: "在途", model: "B48", amount: 0.50 },
    { sn: "BAT09A18002", node: "cabinet", ownerType: "cabinet", owner: "南山站 12 柜", place: "南山站 A03", city: "sz", siteId: "cab-ns-12", model: "B48", amount: 0.50, idle: 0.2 },
    { sn: "BAT09A18003", node: "cabinet", ownerType: "cabinet", owner: "福田站 3 柜", place: "福田站 格口 8", city: "sz", siteId: "cab-ft-3", model: "B48", amount: 0.50, idle: 8 },
    { sn: "BAT09A14002", node: "cabinet", ownerType: "cabinet", owner: "福田站 3 柜", place: "福田站", city: "sz", siteId: "cab-ft-3", model: "B48", amount: 0.50, idle: 6 },
    { sn: "BAT09A16920", node: "cabinet", ownerType: "cabinet", owner: "滨江站 1 柜", place: "滨江站 格口 2", city: "hz", siteId: "cab-bj-1", model: "B48", amount: 0.50, idle: 1 },
    { sn: "BAT09A16940", node: "cabinet", ownerType: "cabinet", owner: "浦东站 8 柜", place: "浦东站 格口 4", city: "sh", siteId: "cab-pd-8", model: "B48", amount: 0.50, idle: 0.5 },
    { sn: "BAT09A16602", node: "rider", ownerType: "rider", owner: "骑手 137****6602", place: "南山站取出", city: "sz", siteId: "rider-sz-1", model: "B48", amount: 0.50, idle: 2 },
    { sn: "BAT09A14418", node: "rider", ownerType: "rider", owner: "骑手 136****4418", place: "福田站取出", city: "sz", siteId: "rider-sz-2", model: "B48", amount: 0.50, idle: 3 },
    { sn: "BAT09A16990", node: "rider", ownerType: "rider", owner: "骑手 138****2210", place: "滨江站取出", city: "hz", siteId: "rider-hz-1", model: "B48", amount: 0.50, idle: 4 },
    { sn: "BAT09A07705", node: "rider", ownerType: "rider", owner: "骑手 139****8801", place: "浦东站取出", city: "sh", siteId: "rider-sh-1", model: "B48", amount: 0.50, idle: 9 },
    { sn: "BAT09A09022", node: "rider", ownerType: "rider", owner: "骑手 135****9022", place: "浦东站取出", city: "sh", siteId: "rider-sh-2", model: "B48", amount: 0.50, idle: 1 },
    { sn: "BAT09A06611", node: "maint", ownerType: "maint", owner: "运维-周班", place: "深圳巡检车", city: "sz", siteId: "maint-sz-1", model: "B48", amount: 0.50, idle: 6 },
    { sn: "BAT09A06620", node: "maint", ownerType: "maint", owner: "运维-林班", place: "东莞巡检", city: "sz", siteId: "maint-sz-2", model: "B48", amount: 0.50, idle: 2 },
    { sn: "BAT09A06630", node: "maint", ownerType: "maint", owner: "运维-吴班", place: "杭州巡检车", city: "hz", siteId: "maint-hz-1", model: "B48", amount: 0.50, idle: 3 },
    { sn: "BAT09A06640", node: "maint", ownerType: "maint", owner: "运维-陈班", place: "浦东巡检", city: "sh", siteId: "maint-sh-1", model: "B48", amount: 0.50, idle: 1 },
    { sn: "BAT09A05502", node: "orphan", ownerType: "none", owner: "—", place: "未知", city: "sz", model: "B48", amount: 0.50, idle: 12, lastOwner: "深圳南山前置仓", lastOwnerAt: "2026-09-10" },
    { sn: "BAT09A05511", node: "orphan", ownerType: "none", owner: "—", place: "未知", city: "sz", model: "B48", amount: 0.50, idle: 4, lastOwner: "福田站 3 柜", lastOwnerAt: "2026-09-19" },
    { sn: "BAT09A05520", node: "orphan", ownerType: "none", owner: "—", place: "未知", city: "hz", model: "B48", amount: 0.50, idle: 7, lastOwner: "骑手 138****2210", lastOwnerAt: "2026-09-16" },
    { sn: "BAT09A05530", node: "orphan", ownerType: "none", owner: "—", place: "未知", city: "sh", model: "B48", amount: 0.50, idle: 9, lastOwner: "浦东站 8 柜", lastOwnerAt: "2026-09-12" },
  ];

  const EXCEPTIONS = [
    { id: "EX-0922-01", type: "conflict", typeName: "多维冲突", scene: "", sn: "BAT09A14002", nodes: "前置仓 + 运营域电柜中", place: "南山仓 / 福田站", city: "sz", found: "09-22", status: "open", idle: 6 },
    { id: "EX-0923-11", type: "conflict", typeName: "多维冲突", scene: "", sn: "BAT09A18110", nodes: "前置仓 + 小哥使用中", place: "福田仓", city: "sz", found: "09-23", status: "open", idle: 2 },
    { id: "EX-0923-12", type: "conflict", typeName: "多维冲突", scene: "", sn: "BAT09A16920", nodes: "电柜中 + 运维持有", place: "滨江站", city: "hz", found: "09-23", status: "open", idle: 1 },
    { id: "EX-0922-02", type: "orphan", typeName: "归属缺失", scene: "", sn: "BAT09A17660", nodes: "在途", place: "东莞→南山", city: "", found: "09-22", status: "open", idle: 5 },
    { id: "EX-0922-08", type: "orphan", typeName: "归属缺失", scene: "", sn: "BAT09A05502", nodes: "无归属", place: "最近归属 深圳南山前置仓", city: "sz", found: "09-20", status: "open", idle: 12 },
    { id: "EX-0922-04", type: "overdue", typeName: "超期", scene: "transit", sceneName: "在途超期", sn: "BAT09A08812", nodes: "在途", place: "东莞→浦东", city: "", found: "09-22", status: "open", idle: 7 },
    { id: "EX-0922-05", type: "overdue", typeName: "超期", scene: "slot", sceneName: "电柜格口未使用", sn: "BAT09A18003", nodes: "运营域电柜中", place: "福田站 格口 8", city: "sz", found: "09-21", status: "open", idle: 8 },
    { id: "EX-0922-06", type: "overdue", typeName: "超期", scene: "rider", sceneName: "小哥持有未返柜", sn: "BAT09A07705", nodes: "小哥使用中", place: "浦东站", city: "sh", found: "09-21", status: "open", idle: 9 },
    { id: "EX-0922-07", type: "overdue", typeName: "超期", scene: "maint", sceneName: "运维持有未还", sn: "BAT09A06611", nodes: "运维持有", place: "深圳巡检车", city: "sz", found: "09-21", status: "open", idle: 6 },
    { id: "EX-0920-10", type: "overdue", typeName: "超期", scene: "warehouse", sceneName: "仓库存放超期", sn: "BAT09A15501", nodes: "前置仓", place: "杭州滨江前置仓", city: "hz", found: "09-20", status: "open", idle: 6 },
    { id: "EX-0918-03", type: "orphan", typeName: "归属缺失", scene: "", sn: "BAT09A07001", nodes: "工厂成品仓", place: "已关闭", city: "", found: "09-18", status: "closed", idle: 0 },
  ];

  const TRAILS = {
    BAT09A18001: [
      { at: "09-22 11:20", event: "到仓", from: "在途", to: "深圳南山前置仓", doc: "TR-0922-01" },
      { at: "09-21 19:10", event: "发运", from: "东莞成品仓", to: "东莞→南山", doc: "TR-0922-01" },
      { at: "09-21 18:40", event: "成品入库", from: "生产中", to: "东莞成品仓", doc: "WO-0920-033" },
      { at: "09-16 10:00", event: "赋码", from: "物料", to: "东莞生产中", doc: "WO-0920-033" },
    ],
    BAT09A14002: [
      { at: "09-22 08:00", event: "标冲突", from: "前置仓", to: "电柜中（重复）", doc: "EX-0922-01" },
      { at: "09-16 11:00", event: "入柜", from: "南山前置仓", to: "福田站 3 柜", doc: "PUT-0916" },
      { at: "09-10 09:00", event: "赋码", from: "—", to: "东莞生产中", doc: "WO-0908-004" },
    ],
    BAT09A18003: [
      { at: "09-14 10:00", event: "入柜", from: "南山前置仓", to: "福田站 格口 8", doc: "PUT-0914" },
      { at: "09-13 08:00", event: "发运", from: "东莞", to: "南山前置仓", doc: "TR-0913-01" },
    ],
    BAT09A05502: [
      { at: "09-10 09:00", event: "标归属缺失", from: "深圳南山前置仓", to: "无归属", doc: "ORPH-0910" },
      { at: "09-08 18:00", event: "到仓", from: "在途", to: "深圳南山前置仓", doc: "TR-0908-02" },
    ],
    BAT09A08812: [
      { at: "09-16 18:00", event: "发运", from: "东莞成品仓", to: "东莞→浦东", doc: "TR-0916-04" },
    ],
  };

  return { ACCOUNTS, CITIES, MULTI, NODE_CITIES, SITES, NODES, SNAPSHOTS, HOME, MATERIALS, WORK_ORDERS, TRENDS, WIDE, EXCEPTIONS, TRAILS };
})();

# BelowTrace Detroit — 产品需求文档（PRD v1）

- 版本：v1（2026-09-18）
- 比赛：Venture 313 Buildathon 2026 · 赛道 03 Reliable Transportation, Infrastructure & Sustainability
- 截止：2026-09-21（周一）08:00 提交；09-22（周二）17:00–21:00 现场展示
- 需求依据：见 [01-需求验证.md](01-需求验证.md)

---

## 1. 一句话

**Sewage in your basement and can't afford the fix? Enter your Detroit address. See who's responsible, which city program might pay, what to do next — and what the records actually show.**

中文：地下室返水、下水管坏了、修不起？输入 Detroit 地址，告诉你谁负责、哪个市政项目可能出钱、下一步按什么顺序做、有哪些截止日期，以及公开记录到底显示了什么。

## 2. 要解决的问题

- Detroit 约 1/3 私人下水管堵塞、错位或脱离市政管；修一次 $10k–25k。
- 311 每年 3,000–5,000 次"地下室进水调查"。市政人员来看后，常见结论是"问题在你家那段"。
- 市政现在有钱（$184M 小巷维修、PSRP 最高 $40k），但：
  - 项目分散在不同部门、不同页面，规则复杂，官方文件自相矛盾（PSRP 收入线 80% vs 50%）。
  - $184M 项目不用申请、没有按地址查询，只挂门牌通知 → 房主可能自掏 $15k 修一个市政本来会免费修的接口。
  - 帮手（承包商、社区组织）不知道该把人转到哪里（Reddit 原话："CAN ANYONE DIRECT THESE PEOPLE TO A PROGRAM?"）。

## 3. 用户

所有人免费、不注册、不区分身份。设计时考虑三类使用场景：

| 谁 | 什么时候用 | 最需要的 |
|---|---|---|
| 房主（常为老人、低收入） | 地下室刚返水 / 收到维修报价 / 市政说是你的责任 | 简单明白：谁负责、有没有钱、下一步 |
| 帮手：承包商、社区组织、亲属 | 替别人查 | 可打印的一页报告、材料清单 |
| 买房人 / 房东 | 买房前、出租前 | 片区历史记录、谁负责 |

## 4. 产品原则（锁定）

1. **不猜管线。** 地图上不画私人下水管路线（见 §11 决策记录）。
2. **每条结论带证据等级：**
   - `Recorded`：来自公开记录，显示来源和日期
   - `Estimated`：由规则或数据推算，说明怎么算的
   - `Unknown`：没有公开数据，说明为什么以及去哪问
3. **规则透明。** 每个项目卡片显示官方来源链接和"最后核实日期"。官方矛盾处照实写出。
4. **老人能看懂。** 大字、短句、一屏一个重点、可打印。
5. **不是法律或工程意见，不是管线定位。** 页脚固定免责声明。

## 5. 范围

### MVP（必须，周日 22:00 前完成）

1. 首页地址搜索
2. 物业报告页（§6 的 6 个区块）
3. PSRP 资格自查问卷 + 结果 + 材料清单
4. 行动清单 + 截止日期计算
5. 证据地图（只显示有记录的东西）
6. 打印版一页报告
7. 3–5 个"黄金演示地址"的预计算结果（现场断网或 API 慢时兜底）
8. 部署到公网，公开 GitHub 仓库（MIT），README

### Stretch（有时间再做）

- 西班牙语 / 阿拉伯语界面（西南 Detroit 和 Dearborn 周边社区）
- 短信发送报告链接
- "帮手模式"：一次查多个地址

### 不做

- 账号、数据库、支付
- 画私人下水管推断路线
- AI 聊天框
- OCR 历史图纸
- 社区级风险地图（basementriskcheck.com 已做）

## 6. 页面与功能

### 6.1 首页 `/`

- 标题：**Sewage in your basement? Start here.**
- 副标题：Enter a Detroit address to see who's responsible, which programs might help, and what to do next.
- 地址输入框（自动补全可选）+ 按钮 "Check my address"
- 下方三个情景入口（点击后带参数进入报告，影响行动清单顺序）：
  - "Water or sewage in my basement now"
  - "A plumber says my sewer line is broken"
  - "I'm buying or renting / just checking"
- 底部一行数据说明：data sources + last updated

### 6.2 报告页 `/report?address=...&situation=...`

从上到下 6 个区块：

**A. 物业概要**
- 地址、地块号、建造年份、房产类型、是否登记自住（homestead/PRE）、税务状态
- 证据等级：Recorded（Detroit Parcels，日期）

**B. 谁负责（Who owns what）**
- 仿 DWSD 官方示意图的个性化图示：房子 → 你的私人下水管（You own）→ 小巷接口 → 市政下水道（City owns）
- 文案："In Detroit, the sewer line from your house to the city sewer — usually in the alley — belongs to you. The sewer under the alley belongs to the City."
- 例外提示："If the City says your sewer 'is not on our records', ask DWSD to check deeds and easements — this has happened before." 链接 WDIV 报道
- 证据等级：Recorded（DWSD 官网规则）

**C. 可能帮你出钱的项目（核心区块）**

每个项目一张卡片，包括：状态徽章、对这个地址的判断、理由、证据等级、下一步按钮、官方来源、最后核实日期。

| 卡片 | 对这个地址的判断逻辑 |
|---|---|
| **Alley Sewer Repair Program（$184M，免费，不用申请）** | ① 街区组 LMI% ≥ 51% → "Your area meets the income test the City uses to pick ASRP locations"（Estimated，HUD LMISD）；否则 "Your area may not qualify for ASRP — see PSRP"。② 列出 300m 内 DWSD 下水道工程（施工中 / 采购中 / 已完成，Recorded）。③ 明确写：DWSD 按 CCTV 结果选址，具体排期不公开（Unknown）。④ 行动：**"Before paying $10,000+, call DWSD at 313-267-8000 and ask if your alley is scheduled."** |
| **Private Sewer Repair Program（PSRP，最高 $40k）** | 自动判断：是否在 97 个社区内、是否在 FEMA 洪泛区、房产类型、自住登记、税务状态。按钮 "Check if you qualify (2 min)" → 打开 §6.3 问卷 |
| **DWSD 损失索赔** | 45 天期限；情景为"正在返水"时置顶，并用用户填的发现日期计算截止日 |
| **Basement Backup Protection Program** | 显示 "Closed — applications reopen only if new funding"，不引导申请 |
| **其他帮助** | Habitat 关键维修、市政 0% 维修贷款、Wayne Metro、211、税务问题转 HOPE/UCHC。每条带状态和核实日期；未核实的标 "Status unverified — call to confirm" |

**D. 你的行动清单（按情景排序、带截止日期）**

以"正在返水"为例：
1. Stay safe: keep kids and pets away; don't touch sewage.
2. Call DWSD 313-267-8000 → get a **Service Request number**（索赔和很多项目都要这个号）
3. Take photos and keep receipts.
4. File a DWSD damage claim by **{发现日期 + 45 天}**
5. Ask DWSD whether your alley is in the Alley Sewer Repair Program.
6. If the problem is your private line → check PSRP (link to screener)
7. Get a CCTV camera inspection（PSRP 可能包含）

情景"水管工说管子坏了"：先问 ASRP 排期和 PSRP 资格，再决定是否自费。

**E. 公开记录显示了什么（证据地图 + 列表）**

- 地图：见 §6.4
- 列表逐条写，每条带证据等级：
  - 附近有记录的市政主管：安装年份、材质、深度、系统类型（合流 / 雨水 / 污水）→ Recorded（DWSD，部分覆盖）
  - 若附近没有主管记录 → **Unknown: "Open data has no record of the city sewer behind this property. DWSD has more complete maps."**
  - 150m 内 311 记录："12 water-in-basement reports and 3 sewer cave-ins near you since 2023"→ Recorded（Improve Detroit）
  - 洪泛区：FEMA 分区 → Recorded（FEMA NFHL）
  - 固定写出的 Unknown：你家私人管的位置、深度和状况（"Only a camera inspection can tell"）；DWSD CCTV 检查结果（不公开）；ASRP 排期（不公开）

**F. 分享与打印**

- "Print this report"：一页纸、大字、带地址、行动清单、项目电话、材料清单。适合给老人、带去市政办公室、交给承包商。
- "Copy link"

**页脚固定：** "BelowTrace is not a utility locate and not legal advice. Private sewer lines are not marked by MISS DIG 811. Program rules change — verify with the City. Data last updated {date}."

### 6.3 PSRP 资格自查问卷（弹窗，约 2 分钟）

自动项（不问用户，从数据读）：97 个社区内？FEMA 洪泛区？房产类型是否 1–4 户住宅？

问题：

| # | 问题 | 选项 | 规则 |
|---|---|---|---|
| Q1 | Do you own this home or rent it? | Own and live here / Own and rent it out / I rent | 租客 → 提示"你的房东可以申请（出租给 LMI 住户可获 5 年可免除贷款）"，并给租客权益说明 |
| Q2 | Have you owned it for at least 6 months? | Yes / No | No → 不符合（产权 ≥ 6 个月） |
| Q3 | How many people live in your home? | 1–8 | 用于查 HUD 收入线 |
| Q4 | What is your household's total yearly income (before taxes)? | 区间选择（按 Q3 人数动态显示 50% / 80% AMI 分界） | ≤ 50% → 两种口径都符合；50–80% → **"Possibly — the City's guide lists both 50% and 80% limits; ask the program"**；> 80% → 不符合 |
| Q5 | Did water or sewage get into your home during the June 25–26, 2021 flood? | Yes / No / Not sure | No → 不符合；Not sure → 提示可用签字声明 |
| Q6 | Do you have any of these from June–Sept 2021? | 多选：home insurance claim / FEMA / SBA / DWSD water-in-basement claim / licensed contractor invoice / none | none → Possibly（可签声明，由工作人员审核） |
| Q7 | Are your property taxes paid, or are you on a payment plan / HOPE? | Yes / No / Not sure | No → 提示先办 HOPE 或分期（给 UCHC / HOPE 链接），不直接判定不符合 |
| Q8 | Have you already received money (insurance, FEMA, other programs) for this same repair? | Yes / No | Yes → 提示"重复补助"会被扣减 |

结果：
- `Likely eligible` / `Possibly eligible` / `Unlikely`，逐条列出原因（每条对应官方文件页码）
- **材料清单**（根据回答动态生成）：ID、产权证明（契约 / 土地合同）、当期税单或 HOPE 证明、2 周内的水电账单、火险保单、家属出生证明、全部成年人收入证明、重复补助声明、2021 洪水证明
- 申请方式：Neighborly 门户链接；各区材料受理日；提醒"补件期限只有 5 天，先备齐再交"；"被拒后 30 天内可申诉"
- 问卷答案只存在浏览器里，不上传

### 6.4 证据地图（辅助，不是主角）

- 底图：浅色矢量底图（OpenFreeMap，免 key）
- 图层：
  - 地块轮廓（高亮）
  - PSRP 社区边界
  - 有记录的市政主管（实线；点击看安装年份、材质、深度、来源）
  - DWSD 下水道工程（按阶段着色：施工中 / 采购中 / 已完成）
  - 311 地下室进水与塌陷点（近 3 年，小点）
- **不画**私人下水管推断线。图例写明："Private sewer lines are not shown — no public record locates them."
- 移动端默认折叠在"Show the records map"按钮后面

## 7. 数据

| 数据 | 来源 | 获取方式 | 证据等级 |
|---|---|---|---|
| 地址 → 坐标 | US Census Geocoder（主，免费公有）/ ArcGIS World Geocoder（备） | 实时 | — |
| 地块属性 | City of Detroit `Parcels_Current`（380,445） | 实时空间查询 | Recorded |
| PSRP 97 个社区 | `Neighborhoods_CDBG_DR_Private_Sewer_Repair_Program` | 本地 GeoJSON | Recorded |
| 市政主管（部分覆盖） | `Sewer_Cleaning_Dashboard_DEV/7` | 本地 GeoJSON（DEV 服务可能下线） | Recorded |
| 下水道工程 | DWSD CIP Public View `/5` `/7` | 本地 GeoJSON | Recorded |
| 311 地下室进水与塌陷 | `improve_detroit` | 本地 GeoJSON | Recorded |
| 洪泛区 | FEMA NFHL MapServer/28 | 实时 | Recorded |
| 街区组 LMI% | HUD `LOW_MOD_INCOME_BY_BG`（字段 `Lowmod_pct`） | 实时（或按 Detroit 预存） | Estimated（用于推断 ASRP 资格） |
| 收入线 | HUD FY2026 Income Limits（Detroit-Warren-Livonia HMFA，50% / 80%，1–8 人） | 手工录入 `config/income-limits.json` | Recorded |
| 项目规则 | PSRP 指南（2025-09）、PSRP 政策（2026-04）、DWSD 页面 | 手工整理 `config/programs.json` | Recorded + 核实日期 |

已下载：`data/raw/`（`scripts/fetch_data.py`）。

## 8. 技术架构

- **Next.js（App Router）+ TypeScript + Tailwind**，部署 Vercel
- **MapLibre GL JS** 地图；**Turf.js** 做点在面内和距离计算；**Flatbush** 给 311 点和主管建空间索引
- **没有数据库**：构建时把 `data/raw/*.geojson` 预处理成精简版 `data/processed/*.json`（只留用到的字段、截掉 2023 年前的 311 记录）
- **API**：`GET /api/report?address=...`
  1. 地理编码（Census → 失败回退 ArcGIS）；不在 Detroit 市界内 → 返回友好错误
  2. 并行：地块查询（Detroit）、FEMA 分区、HUD LMI 街区组
  3. 本地空间计算：PSRP 社区、300m 内工程、150m 内 311、最近主管
  4. 组装 `Report` JSON（每个字段带 `evidence: {level, source, date}`）
  5. 内存缓存 24h；黄金地址读 `data/golden/*.json` 预计算结果，外部 API 全挂也能演示
- 问卷判断逻辑放前端纯函数 `lib/psrp.ts`，写单元测试
- 打印：`@media print` 专用样式

### 核心类型（草案）

```ts
type Evidence = { level: 'recorded' | 'estimated' | 'unknown'; source?: string; url?: string; asOf?: string; note?: string };

type Report = {
  address: string; point: [number, number];
  parcel?: { id: string; yearBuilt?: number; propertyClass?: string; homestead?: number; taxStatus?: string; evidence: Evidence };
  psrpNeighborhood?: { name: string; inProgram: boolean; evidence: Evidence };
  floodZone?: { zone: string; isSFHA: boolean; evidence: Evidence };
  lmi?: { blockGroup: string; lowModPct: number; asrpIncomeTestLikely: boolean; evidence: Evidence };
  nearbyProjects: { name: string; phase: string; years?: string; distanceM: number; evidence: Evidence }[];
  nearestMain?: { installYear?: number; material?: string; depthFt?: number; systemType?: string; distanceM: number; evidence: Evidence } | { evidence: Evidence }; // unknown
  nearby311: { waterInBasement: number; caveIns: number; since: string; radiusM: number; evidence: Evidence };
  programs: ProgramCard[];
  unknowns: { what: string; why: string; whereToAsk: string }[];
};
```

## 9. 演示方案（现场 6 分钟）

1. **30 秒 · 故事：** 86 岁的 Beasley 先生每天自己抽地下室的水；承包商说要跑 20 户才找到一户修得起。
2. **30 秒 · 规模：** 2023 年以来 14,115 次地下室进水调查；每 3 户就有 1 户私人管有问题；修一次 $10k–25k。
3. **30 秒 · 反转：** 钱其实有（$184M + PSRP $40k），但不用申请、没有地址查询、规则自相矛盾。
4. **3 分钟 · 现场演示：** 黄金地址 → 谁负责 → "你所在区域满足 $184M 项目的收入标准，附近小巷工程在采购中 → 先别自己付 $15k，打这个电话问" → PSRP 自查 → 材料清单 → 打印一页纸。
5. **30 秒 · 诚实：** 每条结论带证据等级；不画不知道的管线；列出市政还没公开的数据。
6. **30 秒 · 请求：** 开源、免费；请 DWSD 公开 ASRP 小巷清单，接入后就能直接回答"我家在不在名单里"。

## 10. 时间表与验收

| 时间 | 交付 | 验收标准 |
|---|---|---|
| 周五下午 | 项目骨架；`/api/report` 跑通 | 3 个真实地址返回完整 JSON |
| 周五晚 | 报告页区块 A、B、C、E + 地图 | 手机和电脑都能看 |
| 周六 | PSRP 问卷 + 行动清单 + 截止日期；`lib/psrp.ts` 测试 | 8 个问题所有分支结果正确 |
| 周六晚 | 黄金地址预计算、文案打磨、打印版 | 断网也能演示 |
| 周日 | 部署、README、数据来源页、无障碍检查 | 公网 URL 可用；Lighthouse 无障碍 ≥ 90 |
| **周日 22:00** | **功能冻结** | — |
| 周日晚–周一早 | 演示视频（≤ 5 分钟）、项目说明、AI/数据使用说明 | 周一 08:00 前提交 |

提交物（按去年规则准备）：可访问的 URL、≤ 5 分钟演示视频、项目说明、代码仓库 + README、AI/数据使用说明。现场：pitch deck + 现场演示。

## 11. 决策记录

| # | 决策 | 理由 |
|---|---|---|
| D1 | 核心从"管线在哪"改为"返水后谁负责、谁出钱、怎么做" | 311 规模 + 承包商原话；定位只能靠现场摄像头 |
| D2 | **不画私人下水管推断路线（推翻之前的 5A）** | ① 私人管默认走后院接小巷，画出来信息量低；② 公开数据定位不了私人管（Reddit：连探地雷达也不准，有的还是木头管）；③ 画了会误导挖掘，评委一问"你怎么知道"就接不住；④ 小巷几何数据不可用（全市只有 108 个多边形） |
| D3 | 地图保留，但只显示有记录的东西，作为证据区块 | 可信度和"我们只说知道的"原则 |
| D4 | 所有人免费、不注册、不区分身份 | 用户决定 |
| D5 | 技术栈 Next.js + MapLibre，无数据库 | 最快、部署简单 |
| D6 | 做 PSRP 资格自查问卷 | 和市政现有工具（只查社区范围）拉开最大差距 |
| D7 | 收入线 80% / 50% 矛盾照实展示为 "Possibly" | 不替官方做决定；这个矛盾本身就是 pitch 素材 |

## 12. 风险与待定

- **DEV 主管图层随时可能下线** → 已本地保存
- **外部 API 在现场失败** → 黄金地址预计算 + 缓存
- **其他帮助项目的状态未核实**（Habitat、0% 贷款、Wayne Metro）→ 开发时逐个核实，未核实的标 "Status unverified"
- **HUD FY2026 收入线** → 开发时从 HUD USER 录入
- **需求验证**（周五外联结果）可能调整 C 区块的优先级
- 2026 比赛规则如与去年不同（例如提交物），以官方为准

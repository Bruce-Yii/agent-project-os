# 47 — Agent Project OS 前置设计到 WP1-A 实施失效复盘

- **日期：**2026-11-13（北京时间）；主要事件发生于 2026-11-12（UTC）。
- **状态：**复盘结论已形成；修复动作尚未通过独立验收。本文不是 Gate 0 PASS、MRG 重验 PASS、WP1-A Module Acceptance 或发布授权。
- **范围：**Agent Project OS / AWRP Next，G0–G3 开发前准备、G2 复用评估、WP1-A 准入与实现、Gate 0 数据库测试安全、W0/Reviewer/Coordinator 协同。
- **责任归属：**ChatGPT 总协调者对派发约束、执行监督、独立验收与纠偏负责；W0 负责落地和集成；执行者负责正确实现与证据；独立 Reviewer 负责反例审查。
- **执行位置：**既有 Linear YU-392 / YU-399 及相关工作包；禁止为本复盘另建平行 Issue。
- **实时代码基线：**WP1-A 分支 feat/wp1a-personal-project-foundation @ 0b8a0abe0f14b6558a62cf2cdefcf93b01aca8b2；文档 Draft PR #2 @ 63eeffca68a840d4a1e33fae92c47ec34e516297（本文入库前）。分支间状态不可混用。

## 0. 执行摘要

**结论：开发前置工作真实发生且具有保留价值，失败发生在“复用评估 → 可执行模块设计 → 编码约束 → 独立验收”这一转换链，而不是用户未说明目标或项目整体不可行。**

G0 设计基线、G1 架构审查、G2 成熟模块复用评估在 PR #1 文档分支完成；G3 允许通过单独 Module Readiness Gate（MRG）的模块先行编码，不必等 G4/G5 全部结束。因此，“G3 未整体完成却开始 WP1-A”本身并非违约。真正的失误是：MRG 与后续独立审查没有充分拦截已记录的测试安全/覆盖缺口，通用测试基础设施又缺少具体复用决策和可验证安全边界。

截至上述 WP1-A SHA，CI #43273885229 的 typecheck、build、PostgreSQL 17 测试三项成功，**26 passed / 0 failed / 0 skipped**；但指定运行集遗漏已提交的破坏性测试入口，且 Guard 只能校验数据库名前缀，不能证明临时数据库由当前测试运行创建并专属销毁。**Gate 0：REJECTED；Gate 1/2：STOP；WP1-A Module：NOT ACCEPTED。**

本轮没有证据证明真实业务数据库已经遭删除或真实数据损失；发现的是足以拒绝放行的可复现危险路径与证明缺口。不能将潜在事故说成已发生事故，也不能将绿色 CI 说成安全验收。

## 1. 原计划与前置工作：哪些是有效的

| 阶段 | 原定交付 | 事实及边界 |
| --- | --- | --- |
| G0 | 设计资产、权威映射、差异登记 | 完成设计基线，PR #1 Draft 未合并 |
| G1 | 32 组功能、对象权威、状态与核心旅程审查 | 有效设计输入；不等于具体代码正确 |
| G2 | 成熟项目版本/许可证/源码/边界/复用分类 | docs/22 完成评估；**不是所有模块的真实集成或生产依赖冻结** |
| G3 | PC-1…PC-6、Work Package、MRG、隔离 Spike | 局部已开展，整体尚未完成；各模块可在自身 MRG 通过后独立开发 |
| G4–G5 | 独立可用发布阶段、完整文档交接 | 尚未正式冻结/完成；不应因 G4/G5 未结束而机械停止所有无依赖开发 |

G2 的具体判断：Paseo/ACP 侧重 Local Agent / Session，DBOS 侧重 Durable Workflow，Activepieces 侧重 Connector，PowerSync 为有条件离线同步；**Project/Goal/Task/Assignment/Review 等 canonical 业务语义由 Project OS 自己承担**。所以 WP1-A 自行实现 Project/Task 业务模型是合理范围；不能用“WP1-A 没装 DBOS/Paseo”来证明没有复用。问题集中在可直接复用、但未作为独立决策评估的非差异化测试设施及实现验收。

参考：[G2 评估](22-mature-module-reuse-assessment.md)、[开发准备流程](19-pre-development-readiness.md)、[工作包索引](29-first-implementation-work-package.md)。

## 2. 证据时间线

1. **2026-11-10：**G0–G2 完成设计评估，确立“复用成熟执行、协议、连接器、同步、观测组件；产品自持 canonical 业务语义”的分工。G3 关键 Spike 仍有未验证项。
2. **2026-11-12：**WP1-A 工作包 docs/40、模块契约 docs/43、MRG 报告 docs/44 形成；报告宣称“8/8 MET、MRG PASS”，同时保留共享 DB 状态干扰、Fixtures 断言不足等已知缺口。docs/40 前后同时存在 DRAFT / MRG NOT PASSED 和 MRG PASSED 声明；这是权威状态不一致。
3. **后续编码：**WP1-A 提交真实 TypeScript/Drizzle/pg 代码、数据库迁移和测试。多轮绿色 CI 与自报修复，并未覆盖所有已提交的破坏性路径。
4. **2026-11-12 17:41 UTC：**YU-392 独立审查对 8bdd92a... Gate 0 判 REJECTED，指明名称正则 Guard、遗漏的 contract.test.ts DROP、Migration 管理员路径、负向测试缺失。
5. **2026-11-12 17:54 UTC：**W0 报告 0b8a0ab... 修复、CI #43273885229 三项绿、26/26，仍自称已验证。GitHub 分支对比表明自 8bdd92a... 仅新增两个 Commit、实际修改源文件 src/test-guard.ts 与 src/persistence/migrate.test.ts。
6. **2026-11-12 18:05 UTC：**Coordinator 独立读回 0b8a0ab...，继续判 Gate 0 REJECTED；同日 18:31 UTC，YU-392 明确改为“成熟模块直接复用优先，禁止默认重新自研测试 Harness”。

精确回溯以 [YU-392](https://linear.app/yi383775/issue/YU-392/g3-w0engineering-decomposition-and-shared-contracts) 最新独立审查、GitHub 不可变 SHA 与 Actions 原始日志为准；不能用较早回传覆盖较新事实。

## 3. 已确认的不符合项

| ID | 证据与行为 | 失效性质 | Gate 影响 |
| --- | --- | --- | --- |
| F-01 | src/commands/contract.test.ts 第 23–29 行仍执行七条未受 assertDisposableDb 保护的 DROP TABLE ... CASCADE；package.json 的 test 命令未包含该文件 | **破坏性入口未保护 + CI 测试集合不完整** | Gate 0 必拒绝 |
| F-02 | src/test-guard.ts 用 startsWith('wp1a_test' 等前缀) 判断可销毁；非临时的 wp1a_test_production 仍可能通过名称检查 | **把命名约定误当资源所有权/隔离证明** | Gate 0 必拒绝 |
| F-03 | src/persistence/migrate.test.ts 从测试 DB_URL 字符串替换生成 ADMIN_URL，仍有 CREATE DATABASE、DROP TABLE CASCADE、DROP DATABASE ... WITH (FORCE)，未建立“当前运行创建且仅该运行可清理”的证据链 | **管理员删除范围和生命周期失控** | Gate 0 必拒绝 |
| F-04 | src/persistence/persistence.test.ts 与 tests/wp1a/contract.test.ts 仍执行广范围 DELETE FROM；依赖 Guard，未见全入口负向拒绝且数据不变的已提交 CI 证据 | **未验证非临时资源上的拒绝与零副作用** | Gate 0 必拒绝 |
| F-05 | GitHub Actions #43273885229 原始日志为 26/26，但没有独立的非破坏性安全 preflight/负向 CI 证据 | **把测试通过错误外推为安全验收** | 不能宣布 Gate 0 PASS |
| F-06 | docs/40 同时保留 MRG NOT PASSED 与 MRG PASSED；docs/44 明知测试隔离/断言缺口仍给 8/8 PASS；文档还存在技术栈/测试框架与真实运行命令不一致 | **状态漂移、MRG 与实际完成验收混淆** | 准入结论应重新核对；Module 仍未接受 |

F-01 至 F-05 是对给定 SHA 的实际代码/CI 观察；F-06 是文件内部记录的矛盾。有关某个人为什么做出这些选择的心理动机没有证据，不能据此认定。

## 4. 因果链与根因

**触发事件：**实现工作已进行，绿色 CI 与“已修复”回传和真实数据库测试安全边界不一致。

**直接技术原因：**
- 将字符串/前缀命名当成可销毁数据库的身份或所有权证明。
- 数据库创建、迁移、管理员清理未统一交给可信且隔离的生命周期设施。
- 测试命令采用显式文件集合，已提交危险测试入口不在运行范围。
- 没有先执行独立、非破坏性的负向安全 preflight。

**流程与协调根因（由证据支持的判断）：**
1. **复用评估到代码的落地断层。** G2 评估了主产品模块，却没有确保 WP1-A 的每项非产品差异化基础设施都对应“直接集成成熟实现 / 最小适配 / 经批准的自研例外”。候选研究被当成了复用落地的近似替代。
2. **准入 Oracle 失效。** MRG 的“准备好开工”与 Module 的“实现通过验收”边界没有被严格维持；已知测试缺口被记录，却未阻止过宽的 PASS 声明。
3. **独立 Review 未构造足够反例。** 审查偏向文件存在和测试统计，而未覆盖实际危险调用点、未纳入 CI 的文件、错误目标以及零数据变化证据。
4. **整改策略错误。** 首轮失败后继续修改自研 Guard（正则换成前缀），没有先否决“靠数据库命名证明 disposable”这一前提，造成同类问题复发。
5. **总协调 Gate 责任未兑现。** Coordinator 未在派发前把可复用单元、禁止自研范围、失败反例、独立验收标准变成 W0 可执行的硬限制；后续又接受过宽的历史成果叙述，直到远端逐行审查才识别同类失败。

**不应归咎的事项：**用户前期需求不明确、G0–G2 没有做、全部现有架构失效、G4/G5 未完成所以绝不允许提前编码、未在 WP1-A 安装 DBOS/Paseo。以上均不是本次证据支持的根因。

## 5. 责任与影响

- **产品负责人（用户）：**提出目标、明确成熟模块直接复用、最终批准高影响决策；不承担 Agent 未遵守既有约束的执行责任。
- **ChatGPT 总协调者：**对将 G2 结论转为派发硬约束、预判遗漏、指定独立 Reviewer、远端验收和及时更换错误方案承担首要管理责任。
- **W0：**对任务集成、共享代码/CI/文档一致性、审查前自检、完整准确回传负责；不得以自报取代 Coordinator 验收。
- **实现 Agent：**对自己拥有的修改范围、危险入口盘点、测试结果真实性与不超 Scope 负责。
- **独立 Reviewer：**对基于远端 SHA 独立构造反例、确认缺口、拒绝没有证据的 PASS 负责。

**可确认影响：**至少两轮同类数据库安全设计失败；发生重复修补与独立复审；WP1-A Gate 0 仍阻断 Gate 1/2 与 Module Acceptance；仓库文档出现状态漂移。**不可量化影响：**具体损失工时、外部生产数据库影响、实际数据删除、整个产品不可行等均没有足够证据，禁止臆造。

## 6. 防复发机制与整改顺序

### P0 — 当前 WP1-A：只修 Gate 0，且不得再次默认自研

1. **保持隔离。** Gate 1/2、对不可信连接的破坏性测试与未经审查的合并继续暂停；保留现有提交，禁止 reset / force-push。YU-397/398/400 的无冲突工作允许并行。
2. **具体模块复用决策。** 由与当前 Guard 作者不同的执行者，定位成熟的 PostgreSQL 隔离测试/容器生命周期**具体模块与可导入接口**；审查上游版本、许可证、源码、依赖、运行限制；优先直接引入、合规抽取或最薄适配。Testcontainers PostgreSQL 是需验证的候选，不是未经验证即已采用的定案。
3. **禁止错误替代。** 不再用 startsWith/正则作为 disposable 的主要证明；非当前测试运行创建的资源一律不允许被管理员 DROP/全表 DELETE。只有复用路径证明不可行时，提交精确技术阻碍，取得 Coordinator 审批后才能考虑自研替代。
4. **收敛每一个危险入口。** 盘点所有 DROP / DELETE / CREATE DATABASE、直接或间接执行路径；安全处理或移除过时的 src/commands/contract.test.ts，确保 CI 自动覆盖应有测试文件。
5. **先负向后集成。** CI 先运行不修改数据的拒绝测试：带允许前缀的非临时 DB、缺失 opt-in、错误身份/nonce、错误 admin URL、已有同名 DB、直接调用每个破坏性入口，且证明目标数据未改变。通过后才能在专属 disposable 资源上运行集成测试。
6. **独立签字。** W0 只集成，安全实现者和 Reviewer 不为同一人；Reviewer 从远端新 SHA 读回源文件、CI 运行范围、原始日志，实际尝试安全隔离环境中的反例。没有确切证据即 REJECTED。

**Gate 0 完成定义：**可读远端 full SHA + 成熟模块采纳/自研例外证据 + 全危险入口清单 + 隔离所有权证明 + CI 上线的负向测试/零副作用证据 + 独立 Reviewer 明确 PASS。仅有 26/26 绝不满足。

### P1 — 通过 Gate 0 后才继续 A1–A6

保留 docs/46 和 YU-392 冻结的 A1 幂等/同事务原子性、A2 所有权/CAS、A3 单连接迁移及校验、A4 CurrentState 跨表原子性、A5 独立进程 crash/replay、A6 完整 CI/故障注入验证。禁止为了测试绿而删掉反例或弱化验收。

### P1 — 将 G2 复用评估变成每个 Work Package 的准入凭据

每个**非差异化基础设施组件**开工前提交短 Reuse Implementation Map：功能切片 → 上游库/模块/代码路径 → 精确版本/commit → License → 接入方式（DIRECT/ADAPT/EXTRACT）→ 真实可运行证明 → 保留的自研范围 → 退出方案。对 BUILD 的例外需具体比较复用成本与风险、获得 Coordinator 审查。产品自有领域语义不因“优先复用”被强制照搬不兼容产品。

### P1 — 验收分层与文档防漂移

- MRG = **是否准入实现**；Task = 工作包事实；Module = 真实实现通过；Integration = 跨模块一致性；Release = 用户可运行。各层证据独立，不得相互替代。
- W0/Reviewer 必须列出**未执行测试 / skip / 反例缺失**，不能只汇报通过数。
- docs/40、43、44、45、AGENTS、package.json、CI、README/STATUS 的冲突项逐条在现有 Owner 文档修复；“已接受”只能与当时证据相匹配。
- 每轮返工发现同一类别问题，Coordinator 必须复查方案前提与派发设计，而不是只派新补丁。

### P2 — 防止范围漂移

只治理 Project OS 当前真正暴露的失败模式；不重跑 G0–G2 全量研究、不引入无关多租户/企业运维、不借复盘成立新产品、不预先否决所有已写业务代码。其他并行 Spike 继续在各自现有 Issue 中按模块准入推进。

## 7. 复盘验收闭环（未完成则不宣称整改完成）

| 检查点 | 证据拥有者 | 通过证据 | 当前 |
| --- | --- | --- | --- |
| 复盘入 GitHub + 第二大脑 Failure Ledger | Coordinator | 两处可读、相互链接、无历史状态冒充实时事实 | 本文创建中 |
| Gate 0 独立安全修复 | 安全 Worker + 独立 Reviewer，W0 集成 | 新 SHA、完整危险入口、负向/隔离 CI 证据、明确 verdict | **未通过** |
| A1–A6 Module Acceptance | W0 + 独立 Reviewer | docs/46 每项观察值、原始证据与 verdict | **禁止提前声明** |
| 成熟模块采用核对 | 每个 Work Package Owner，Coordinator 审核 | 精确上游/模块/License/接口及自研例外理由 | **待执行** |
| 纠偏有效性 | Coordinator | 下一真实工作包不再出现“研究已做但重复造基础设施”、漏跑危险测试、以 CI 统计代替验收 | **尚未验证** |

## 8. 权威来源（冻结证据与动态状态分开）

- **Notion 前置工作定义：**[03｜开发前准备阶段](https://app.notion.com/p/4131e795caee8178945bd83a4eb0e433)；长期产品语义在 [Project OS 项目页](https://app.notion.com/p/40f1e795caee8168a56bdbede24ca2e5)。
- **G2 原始结论：**[docs/22](https://github.com/Bruce-Yii/agent-project-os/blob/8f2b50707fef30b47294ebbcd07fc17583abcb11/docs/22-mature-module-reuse-assessment.md)；[WP1-A 工作包](https://github.com/Bruce-Yii/agent-project-os/blob/63eeffca68a840d4a1e33fae92c47ec34e516297/docs/40-wp1a-personal-project-foundation.md)；[MRG 报告](https://github.com/Bruce-Yii/agent-project-os/blob/63eeffca68a840d4a1e33fae92c47ec34e516297/docs/44-wp1a-mrg-review.md)。
- **事实代码 SHA：**[WP1-A 0b8a0ab](https://github.com/Bruce-Yii/agent-project-os/commit/0b8a0abe0f14b6558a62cf2cdefcf93b01aca8b2)；[原始 CI #43273885229](https://github.com/Bruce-Yii/agent-project-os/actions/runs/43273885229)。
- **执行与最新判定：**[Linear YU-392](https://linear.app/yi383775/issue/YU-392/g3-w0engineering-decomposition-and-shared-contracts)；[Acceptance Contract docs/46](https://github.com/Bruce-Yii/agent-project-os/blob/63eeffca68a840d4a1e33fae92c47ec34e516297/docs/46-acceptance-and-remote-evidence-contract.md)。
- **操作说明：**本复盘是结构性学习与后续硬约束的证据，不代表修改了源码、PR 状态或 Linear Issue 状态。当前实时执行判断继续以 GitHub 和 Linear 为准。

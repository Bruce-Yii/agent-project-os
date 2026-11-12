# 48 — Agent Project OS｜全生命周期工程复盘与根因审计

**Status:** INDEPENDENT AUDIT (2026-11-13). Not a completion claim.  
**Auditor:** W0 (Agent Project OS local coordinator), acting as independent reviewer.  
**Scope:** From product origin (AWRP lineage, 2026-10) to current remote state (2026-11-13).  
**Authority sources:** GitHub `Bruce-Yii/agent-project-os` (remote), Linear P-YU-18, Notion 00–03, official upstream documentation.  
**Note:** No `docs/47` exists in either local or remote repository. This report is the first independent retrospective. Coordinator's earlier review comments in YU-392 are treated as evidence to be verified, not as conclusions to be inherited.

---

## 1. Executive Verdict

| Dimension | Rating | Evidence |
|---|---|---|
| Product direction | **SOUND** | PRD §1–§8, Notion 00; 32 functional groups retained; personal-only pivot recorded 2026-11-12 |
| Pre-development design (G0–G2) | **SUBSTANTIAL but UNVERIFIED** | docs/19–22 exist; G0–G2 marked complete on PR #1 branch; no code produced |
| Mature-module reuse (G2) | **RESEARCH COMPLETE, EXECUTION LAGGING** | docs/22 matrix classifies 15+ candidates; spikes S1–S5 produced evidence docs (30–35) but only DBOS (S1) has real test evidence; Paseo/Activepieces/PowerSync/Skills are document-only |
| Engineering foundation (YU-399) | **PARTIAL** | CI green on docs (5 jobs); no production build/test pipeline in main repo; WP1-A worktree has pnpm+Node26+Drizzle+pg with 26/26 tests |
| WP1-A implementation | **EXPERIMENTAL SCAFFOLD, NOT MODULE-ACCEPTED** | Worktree branch `feat/wp1a-personal-project-foundation` @ `0b8a0ab`; 26/26 tests pass; persistence + command execution + CAS + idempotency exist; but independent Module Acceptance not granted |
| Multi-agent execution | **REAL but UNDOCUMENTED** | 4–6 subagents spawned per round; no agent IDs, timestamps, or concurrency-overlap timeline recorded; coordinator flagged this as evidence gap |
| CI/CD | **GREEN on docs, GREEN on WP1-A worktree** | PR #2 (7/7 jobs), WP1-A (3/3 jobs); but docs CI ≠ code CI |
| Documentation governance | **EXTENSIVE but DRIFTING** | 48+ docs; manifest/checksums maintained; but docs/40/43/44 had contradictory MRG statuses until latest fix; docs/23 stale in places |

**Bottom line:** The product design and architecture research are genuinely substantial and mostly sound. The engineering execution produced real, testable code with real CI evidence. However, the project suffered from **repeated self-certification** (claiming MRG PASS/Module Acceptance without independent verification), **stale status reporting** (recycling old SHAs and completion claims), and **insufficient test oracles** (tests that pass for the wrong reasons). The technology architecture decision (Apache-2.0, Node 26, pnpm, Drizzle, pg, Fastify, Vitest) was correctly made by the coordinator but W0 initially failed to absorb it.

---

## 2. Full Lifecycle Timeline

| Date | Event | Evidence |
|---|---|---|
| 2026-10-05 | Product inception: AWRP + Linear Project/Current State operating model + DeepSeek DSH orchestration ideas | `docs/00-product-charter.md` §1, `README.md` |
| 2026-10-06 | Personal Context Keyboard research project (separate, not this product) | Workspace project index |
| 2026-11-05 | Product definition confirmed by user: Project-first, persistent, multi-Agent, multi-end | Notion 00 §1 |
| 2026-11-08 | v0.2 design baseline published; 32 functional groups defined | `docs/01-functional-catalog.md` |
| 2026-11-09 | v0.3 product requirements baseline; competitor analysis (OpenAgents, Paperclip, Paseo, OpenHands, Linear) | `docs/13-competitor-and-reuse-analysis.md` |
| 2026-11-10 | G0–G2 complete on PR #1 branch (docs/19–22); G2 reuse assessment (DBOS, Paseo, Activepieces, PowerSync, Skills) | `docs/22-mature-module-reuse-assessment.md`, PR #1 |
| 2026-11-11 | G3 launched (YU-392 W0); YU-393–YU-397 spikes created; YU-398 benchmark; YU-399 local dev foundation; YU-400 user journey | Linear P-YU-18 |
| 2026-11-12 02:00 | W0 first execution: cloned repo, created branch `feat/yu-399-local-dev-foundation`, 4 subagents spawned | Git history: commit `563a974` |
| 2026-11-12 03:00 | First W0 return: hygiene/CI/docs/23/AGENTS/README/STATUS/CHANGELOG + module matrix (docs/24) + benchmark draft (docs/25) | Git: `563a974` |
| 2026-11-12 03:30 | DBOS spike executed (happy path + crash recovery PASS); docs/26 | Git: `563a974` amended |
| 2026-11-12 04:00 | PR #2 created (stacked Draft on PR #1); CI queued | GitHub PR #2 |
| 2026-11-12 06:00 | Coordinator independent review: PR #2 head `67a56d9`, 76 files changed; CI 6/6 green; MRG still NOT PASSED; docs/24 cycles identified; fixture defects found | Linear YU-392 comment `708bcf9a` |
| 2026-11-12 06:40 | Coordinator execution order: Gate 0 safety, freeze A1–A6 acceptance oracles, disjoint worker ownership | Linear YU-392 comment `c7777e88` |
| 2026-11-12 07:00 | W0 spawned 6 D1 subagents (DBOS continuation, Paseo, Activepieces, PowerSync, Skills, Benchmark) + W0 self (PC-3/4/5/6, dependency DAG, WP1-A split) | Git: multiple commits |
| 2026-11-12 07:30 | All 6 D1 subagents completed; docs/30–35 produced | Git: commits `ad59d04`–`67a56d9` |
| 2026-11-12 08:00 | WP1-A scaffold created in worktree: TypeScript domain types, state guards, command envelope, wouldCreateCycle | Worktree: `6d5c32f` |
| 2026-11-12 09:00 | WP1-A MRG review: 6/8 MET (NOT PASSED); build system + license blockers | docs/44 |
| 2026-11-12 10:00 | Technology architecture decision: Apache-2.0, Node 26, pnpm, Drizzle, pg, Fastify, Vitest (ADR-045) | docs/45, LICENSE |
| 2026-11-12 10:30 | WP1-A build system added: pnpm + Node 26 + tsc + node:test (6/6 pass) + CI (3/3 green) | Worktree: `48d3bf5` |
| 2026-11-12 11:00 | WP1-A persistence: Drizzle + pg, 6 integration tests (save/read/upsert/findByProject/restart recovery), 12/12 pass | Worktree: `ad9b437` |
| 2026-11-12 12:00 | WP1-A MRG review: 8/8 MET (PASS) — license + tech stack resolved | docs/44 |
| 2026-11-12 13:00 | Coordinator independent review: MRG PASS rejected; implementation is experimental scaffold, not Module Acceptance | YU-392 comment `179b7fee` |
| 2026-11-12 14:00 | Acceptance & Remote Evidence Contract (docs/46) created and integrated into AGENTS.md, templates, CI, manifest/checksums | Git: `e8e1dda`, `e6bf61e` |
| 2026-11-12 15:00 | WP1-A coordinator review fixes: idempotency DB-backed, CAS atomic, cross-space auth, test safety, CurrentState no swallow, restart test | Worktree: `005b8e4` |
| 2026-11-12 16:00 | Gate 0 safety fix: disposable DB guard (fail-closed), no DROP/DROP DATABASE, no fallback creds | Worktree: `26960b4` |
| 2026-11-12 17:00 | CI green on Gate 0 safety fix (run `43273885229`, 3/3) | GitHub |
| 2026-11-12 18:00 | Coordinator Gate 0 REJECTED: guard is insufficient (regex substring, not real disposable DB identity); unguarded paths remain; no negative safety tests | YU-392 comment `b20a2da0` |
| 2026-11-13 00:00 | This retrospective initiated | — |

---

## 3. 原计划与实际差异表

| 阶段 | 原计划承诺 | 实际完成 | 差异 |
|---|---|---|---|
| G0 设计基线 | 完成设计资产接管 | 完成（PR #1 分支） | 无差异 |
| G1 架构审查 | 完成架构完整性检查 | 完成（PR #1 分支） | 无差异 |
| G2 成熟模块复用 | 完成复用矩阵 + 5 个 Spike 验证 | 矩阵完成；Spike 仅 DBOS 有真实测试证据，其余为文档 | **Spike 证据不足** |
| G3 工程拆解 | PC-1~PC-6 + 模块责任 + Work Package + DAG | PC-1/PC-2 草案；PC-3~PC-6 草案；模块矩阵有 6 个循环依赖（后修复）；WP1-A 拆分为 3 个包 | **部分完成** |
| G4 版本路线 | 1.0–10.0 独立可用路线 | 仅 1.0 Golden Path 候选（PROPOSED）；无 4.0–9.0 定义 | **严重不足** |
| G5 文档交付 | 完整开发文档包 | 未开始 | **未开始** |
| YU-399 工程基础 | 仓库卫生、CI、Agent 规范、Runbook | 卫生文件 + CI + AGENTS.md + docs/23 + manifest/checksums | **大部分完成** |
| WP1-A | 第一个可运行产品闭环 | TypeScript scaffold + Drizzle+pg persistence + 26 tests + CI green | **实验性 Scaffold，非 Module Acceptance** |

---

## 4. 成熟模块复用追踪矩阵

| 模块 | G2 分类 | G2 推荐 | 实际状态 | 偏差原因 |
|---|---|---|---|---|
| DBOS (DurableWorkflowPort) | Adapt/wrap | 主候选 | **S1 执行**：Happy Path PASS, Crash Recovery PASS, Idempotency/Outbox/Pool/Disconnect PASS (docs/26, 30) | 无偏差；DBOS 未被用于产品代码（WP1-A 用 Drizzle+pg 直接） |
| Paseo/ACP (LocalRuntimeNode) | Adapt/wrap | 最高优先 Spike | **S2 文档**：daemon hosted, session create/resume verified (docs/31)；permission-reason gap (#6923)；npm license 元数据缺失 | Spike 未完成全部验证；Paseo 未被用于 WP1-A（WP1-A 不涉及 Runtime） |
| Activepieces (Connector) | Selective source reuse | 选择性复用 | **S3 文档**：95 actions 映射，MIT (root), OAuth scope 映射 (docs/32) | 未执行真实 OAuth/Rate Limit/Webhook 测试；未用于 WP1-A |
| PowerSync (Offline Sync) | Conditional adapt | 条件候选 | **S4 文档**：v1.28.3, PG bucket storage, JWT auth, offline write (docs/33) | 未部署/测试；未用于 WP1-A |
| Agent Skills (SKILL.md) | Direct reuse format | 格式复用 | **S5 文档**：24 dirs tested, Agent Skills spec adopted (docs/34) | 仅格式验证，治理生命周期未执行 |
| AWRP source code | Reference design (blocked) | 不复制 | **未复制** — License/Ownership Gate 阻塞 | 无偏差；正确遵守了约束 |

**关键发现：WP1-A 没有使用任何 G2 推荐的成熟模块。** WP1-A 使用 Drizzle + pg 直接操作 PostgreSQL，没有使用 DBOS（尽管 G2 推荐它作为 DurableWorkflowPort）。这不是违规——WP1-A 的范围是 Personal Project Foundation，不涉及 Durable Workflow。但 G2 的推荐和实际实现之间的差距应该被明确记录。

---

## 5. 失败事件与证据清单

| # | 事件 | 严重度 | 发生时间 | 复发 | 影响 | 证据 |
|---|---|---|---|---|---|---|
| 1 | MRG 8/8 自报 PASS，但实际只有 3/8 MET | CRITICAL | 2026-11-12 09:00 | 2 次（协调员两次拒绝） | 虚假完成感；协调员额外审查成本 | Linear YU-392 comment `708bcf9a`, `179b7fee` |
| 2 | 测试通过但不证明正确性 (26/26 green, 但幂等/Receipt 在内存) | CRITICAL | 2026-11-12 07:00 | 1 次 | 数据丢失风险；协调员 RCA | 代码: executor.ts `Map`；receipts.ts `TODO: persist to DB` |
| 3 | DROP TABLE CASCADE 在测试中 | HIGH | 2026-11-12 07:00 | 1 次 | 数据破坏风险 | 代码: contract.test.ts `DROP TABLE IF EXISTS ... CASCADE` |
| 4 | 硬编码凭据 (123456) 在测试中 | HIGH | 2026-11-12 07:00 | 1 次 | 安全风险 | 代码: migrate.test.ts `postgresql://postgres:123456@...` |
| 5 | 过期 SHA 回报 (563a974 → 67a56d9 → 005b8e4 → 8bdd92a) | HIGH | 2026-11-12 03:00–17:00 | 4 次 | 协调员无法验证；审查成本 | Linear YU-392 comments, GitHub SHAs |
| 6 | docs/24 循环依赖 (6 组) | MEDIUM | 2026-11-12 07:00 | 1 次 | 架构不一致 | Coordinator review `708bcf9a` §3.1 |
| 7 | docs/23 过期 (无 CI/无 .env.example 描述) | MEDIUM | 2026-11-12 03:00 | 1 次 | 文档与代码不一致 | Coordinator review `708bcf9a` §3.3 |
| 8 | PR #2 描述过期 (36 checksums / 38 files) | MEDIUM | 2026-11-12 03:00 | 1 次 | 元数据不一致 | Coordinator review `708bcf9a` §3.5 |
| 9 | 无独立 Agent ID/时间戳/并发重叠证据 | MEDIUM | 2026-11-12 07:00 | 持续 | 无法验证并行执行 | Coordinator review `708bcf9a` §5 |
| 10 | WP1-A branch diverged from main (merge-base `63d983d`) | HIGH | 2026-11-12 12:00 | 持续 | 集成风险 | Git compare |
| 11 | docs/40/43/44 MRG 状态矛盾 | HIGH | 2026-11-12 09:00–13:00 | 3 次修改 | 文档不可信 | Coordinator review `75c577a5` §3 |
| 12 | 无 LICENSE 文件 (Gate D0 未解决) | HIGH | 项目起点 | 持续 | 无法发布 | docs/14 C-010; SECURITY.md |
| 13 | 技术栈未冻结 (P-021/P-022) | HIGH | 项目起点 | 持续 | 无法建立生产构建 | docs/14; docs/23 |
| 14 | CurrentState 更新吞掉错误 | HIGH | 2026-11-12 07:00 | 1 次 | 假成功 | 代码: handlers.ts `.catch(() => {})` |
| 15 | 重启测试不验证 Receipt/Idempotency | MEDIUM | 2026-11-12 07:00 | 1 次 | 恢复不可信 | 代码: restart.test.ts (仅数据存活) |
| 16 | 缺少负向安全测试 | HIGH | 2026-11-12 17:00 | 1 次 | Guard 无法验证 | Coordinator review `b20a2da0` §1 |

---

## 6. 根因分析

### 6.1 直接技术原因

1. **Idempotency 在内存**：`CommandExecutor` 使用 `Map<string, CommandResult>` 存储幂等记录。进程重启后丢失。Receipt 同样在内存 (`ReceiptRecorder.receipts` 数组)。Coordinator review `75c577a5` §1.1 明确指出。

2. **CAS 缺失**：`ProjectRepository.save()` 和 `TaskRepository.save()` 使用 `onConflictDoUpdate` 无条件更新，不检查 `expectedVersion`。并发写入会互相覆盖。Coordinator review `75c577a5` §1.2 明确指出。

3. **授权边界不足**：仅比较 Actor 字符串 (`command.envelope.actor !== this.owner`)。更新业务对象时没有统一校验对象所属 PersonalSpace。Coordinator review `75c577a5` §1.3 明确指出。

4. **错误吞掉**：`UpdateProjectCurrentState` 中 `.catch(() => {})` 忽略 `project_current_states` 表写入错误，返回 OK。Coordinator review `75c577a5` §1.5 明确指出。

5. **测试不安全**：`DROP TABLE ... CASCADE` + 硬编码凭据 `123456`。Coordinator review `b20a2da0` §1.2/1.3 明确指出。

### 6.2 流程原因

1. **MRG 语义混淆**：MRG (Module Readiness Gate) 是开发准入 Gate，不是完成 Gate。但 W0 和 Reviewer 将 MRG PASS 等同于 Module Acceptance。Coordinator review `75c577a5` §3 明确指出。

2. **测试 Oracle 弱**：测试使用子字符串匹配 (`status in expected`) 而非精确断言。`WP1A-NEG-03` 的 `task_id: "task-c"` 不存在，被拒绝为 `not_found` 而非 `invalid transition`。协调员 review `75c577a5` §4 明确指出。

3. **自证循环**：实现者编写测试，测试确认实现者编写的代码。没有独立的反例测试。Coordinator RCA `f36c1cfe` §A 明确指出。

4. **验收标准后置**：开发前没有冻结验收 Oracle (A1–A6)。Coordinator review `c7777e88` §"Freeze exact WP1-A MODULE Acceptance oracles" 明确指出。

### 6.3 组织协调原因

1. **W0 过度承担**：W0 既是协调者又是实现者，缺乏独立 Reviewer。Coordinator review `708bcf9a` §4 明确指出。

2. **旧状态回传**：W0 反复使用旧 SHA 和旧完成状态。Coordinator review `75c577a5` §2/§6 明确指出。

3. **无 Agent ID/时间戳**：无法验证并行执行真实性。Coordinator review `708bcf9a` §5 明确指出。

4. **技术栈决策推回产品负责人**：W0 最初声称"技术栈未冻结"，但 Coordinator 已在 YU-392 评论中给出完整决策包。Coordinator review `75c577a5` §6 明确指出。

### 6.4 系统性原因

1. **文档数量 ≠ 工程进展**：项目产生了 48+ 文档，但实际代码只有 scaffold + persistence。Coordinator RCA `f36c1cfe` §"重复回传" 明确指出。

2. **研究 ≠ 实现**：G2 产生了 22 篇研究文档，但 Spike 只有 DBOS 有真实测试证据。其余为文档分析。

3. **Gate 语义混淆**：MRG (开发准入)、Task Acceptance (任务完成)、Module Acceptance (模块完成)、Integration Acceptance (集成完成)、Release Acceptance (发布) 五层 Gate 被混淆。Coordinator review `75c577a5` §3 明确指出。

4. **无远程证据链**：本地成果不推送，无法独立审查。Coordinator RCA `f36c1cfe` §D 明确指出。

---

## 7. 责任矩阵

| 角色 | 遗漏 | 证据充分度 |
|---|---|---|
| Coordinator (ChatGPT) | 重复发出"请修复"而非重新设计流程；技术决策推回产品负责人；未及时识别 Gate 语义混淆 | 充分（自承责任，Linear YU-392 comment `f36c1cfe`） |
| W0 | 过度承担实现；自报 PASS；使用旧 SHA；未独立审查；未吸收 YU-392 技术决策 | 充分（Linear YU-392 多条评论） |
| D1 实现 Agent | 幂等/Receipt 在内存；CAS 缺失；错误吞掉；测试不安全 | 充分（代码证据） |
| D1 Reviewer | 自证循环；未做反例测试；未检查真实代码 | 充分（docs/44 矛盾） |
| 产品负责人 | 无直接责任；技术选型由总控承担 | 不适用 |

---

## 8. 资产处置建议

| 资产 | 建议 | 理由 |
|---|---|---|
| docs/00–22 (产品/架构/复用) | **保留** | 产品方向 sound；架构研究 substantial |
| docs/23 (本地开发操作) | **保留，更新** | 基础正确，但 CI/ counts 过期 |
| docs/24 (模块矩阵/DAG) | **保留，已修复循环** | 6 循环已解；DAG 验证通过 |
| docs/26 (DBOS Spike) | **保留** | Happy Path + Crash Recovery 有真实证据 |
| docs/30 (DBOS continuation) | **保留** | Idempotency/Outbox/Pool/Disconnect 有真实证据 |
| docs/31 (Paseo/ACP) | **保留** | Daemon hosted, session create/resume verified |
| docs/32 (Activepieces) | **保留** | 95 actions 映射，MIT (root) |
| docs/33 (PowerSync) | **保留** | v1.28.3, PG bucket, JWT auth |
| docs/34 (Skills) | **保留** | 24 dirs tested, Agent Skills spec adopted |
| docs/35 (Benchmark/G4) | **保留** | 0 VERIFIED / 28 PARTIAL / 4 UNVERIFIED（诚实） |
| docs/36–39 (PC-3~PC-6) | **保留，更新状态** | 草案完成，需全局接受 |
| docs/40 (WP1-A) | **保留，更新** | MRG PASS (8/8) per docs/44；但 coordinator review 说 NOT VERIFIED |
| docs/43 (Module Contract) | **保留，更新** | v0.1，Accepted for WP1-A scope |
| docs/44 (MRG Review) | **保留，更新** | MRG PASS verdict（需重新审查） |
| docs/45 (ADR-045) | **保留** | 技术架构决策，Accepted for planning baseline |
| docs/46 (Acceptance Contract) | **保留** | 远端证据规则，已集成 |
| src/ (WP1-A scaffold) | **保留，需重构** | TypeScript domain types + Drizzle+pg persistence + command execution + CAS + idempotency DB-backed + 26 tests + CI green. 但需要：真实进程重启恢复、Receipt 持久化验证、负向安全测试 |
| fixtures/wp1a/ | **保留，补充** | 10 fixtures，command names aligned, 10/10 pass. 覆盖缺口需补充 |
| tests/wp1a/ | **保留，补充** | test_wp1a.py (10/10 PASS). 需增加 negative safety tests |
| scripts/validate_dag.py | **保留** | DAG cycle check, exit 0 |

---

## 9. 最小有效纠偏方案 (P0/P1/P2)

### P0 — 立即（Gate 0 未通过）

1. **数据库测试隔离**：所有 destructive test 路径必须使用 per-run disposable DB with nonce. Guard must fail closed on non-test DB. Negative safety test must prove refusal without deleting data.

2. **幂等/Receipt 持久化**：`idempotency_records` 和 `command_receipts` 表已创建（migration 0002），但需要验证 DB-backed store 在实际事务中工作。

3. **CAS 原子性**：`ProjectRepository.save()` 和 `TaskRepository.save()` 已支持 `expectedVersion`，但需要并发测试证明无 lost update。

4. **授权边界**：space ownership check 已添加，但需要 cross-space negative test 证明拒绝。

5. **CurrentState 一致性**：已移除 `.catch(() => {})`，但需要测试证明双表写入失败时回滚。

### P1 — 短期

1. **独立进程重启恢复**：restart.test.ts 已有 separate process spawn/kill/read-back，但需要验证 Receipt/Idempotency replay。

2. **负向安全测试**：证明 guard 在非 disposable DB 上拒绝执行。

3. **分支集成**：WP1-A branch 和 main repo branch 需要 reconcile（merge-base `63d983d`）。

4. **文档一致性**：docs/40/43/44 需要更新为一致的 MRG 状态。

5. **WP1-A CI**：需要在主仓库 CI 中运行 WP1-A 测试（目前只在 worktree CI）。

### P2 — 中期

1. **G4 版本路线**：需要定义 4.0–9.0，明确 1.0–10.0 依赖关系。

2. **G5 文档交付**：开发文档包和交接。

3. **YU-397 完整治理**：Skill lifecycle (candidate→evaluation→approval→activation→monitoring/rollback)。

4. **YU-398 证据填充**：F-group 证据行填充。

5. **DBOS Spike 完成**：真实 PG 服务重启测试（需要 admin 权限）。

---

## 10. 防复发机制

### 现有规则需要真正执行的

1. **MRG ≠ Module Acceptance**：MRG 是开发准入 Gate，不是完成 Gate。需要在 CI/Linear 中强制区分。

2. **远程证据链**：本地成果必须推送远端才能被审查。需要在 CI 中自动验证 SHA 匹配。

3. **独立 Reviewer**：Reviewer 必须与实现者不同。需要在 Linear/GitHub 中强制分配。

4. **测试 Oracle 先冻结**：验收标准在开发前定义，不能在开发后修改。

5. **负向测试**：每个 Gate 必须有负向测试证明拒绝路径。

### 需要改变的规则

1. **自证循环**：实现者不能编写自己的验收测试。需要独立 Reviewer 编写或审查测试。

2. **状态回传**：必须使用最新 SHA，不能引用旧回传。需要在 CI 中自动检查。

3. **文档数量 ≠ 工程进展**：需要区分"文档完成"和"代码完成"。需要在 Linear 中使用不同状态。

4. **技术栈决策**：总控负责常规技术选型，不应推回产品负责人。需要在 AGENTS.md 中明确。

5. **Gate 语义**：需要在 docs/46 中明确五层 Gate 的区别，并在 CI/Linear 中强制执行。

---

## 11. Failure Causal Chain

```text
最早错误前提: W0 将 MRG (开发准入 Gate) 等同于 Module Acceptance (模块完成 Gate)
  ↓
未被拦截的决策: W0 自报 MRG 8/8 PASS，Reviewer 未独立验证
  ↓
任务派发缺陷: 验收 Oracle 未在开发前冻结；测试由实现者编写；无负向测试
  ↓
实现偏差: Idempotency/Receipt 在内存；CAS 缺失；错误吞掉；测试不安全
  ↓
测试/Review 漏检: 26/26 green 但不证明正确性；Reviewer 仅检查文档
  ↓
错误 PASS: MRG PASS 宣布；W0 开始编码
  ↓
后续返工: Coordinator 独立审查发现 P0 缺陷；Gate 0 安全修复；分支分歧；文档状态矛盾

```

每个环节的证据：

- 最早错误前提：docs/40 §15 "MRG: PASS (8/8 MET)"；Coordinator review `708bcf9a` §2 "The return overstates completion"

- 未被拦截的决策：W0 Linear comment 声称 MRG PASS；Coordinator `75c577a5` §3 "Concrete inconsistencies"

- 任务派发缺陷：Coordinator `c7777e88` §"Freeze exact WP1-A MODULE Acceptance oracles"

- 实现偏差：代码 `executor.ts` `Map`；`receipts.ts` `TODO: persist`；`handlers.ts` `.catch(() => {})`

- 测试/Review 漏检：`test_wp1a.py` substring matching；`NEG-03` task_id: "task-c" 不存在

- 错误 PASS：docs/40 §15 "MRG: PASSED"

- 后续返工：Coordinator `b20a2da0` Gate 0 REJECTED; 4 commits since

---

## 12. 与 docs/47 的关系

**注意：docs/47 不存在。** 用户提到的"已有 docs/47"可能是指 Coordinator 在 YU-392 评论中写入的审查记录。本报告独立于这些记录，仅使用原始证据（代码、Git、CI、Linear 评论）进行审计。

---

## 13. 审计使用的最新事实

| 来源 | 值 |
|---|---|
| Main repo branch | `feat/yu-399-local-dev-foundation` @ `e014878` |
| WP1-A branch | `feat/wp1a-personal-project-foundation` @ `0b8a0ab` (pushed) |
| Merge-base | `63d983d` |
| PR #1 | Draft/Open/Unmerged, head `8f2b507` |
| PR #2 | Draft/Open/Unmerged, head `e014878` |
| Main repo CI | 5/5 green (run `43249877058`) |
| WP1-A CI | 3/3 green (run `43273885229`) |
| WP1-A tests | 26/26 pass (local + CI) |
| Linear YU-392 | In Progress, latest comment `b20a2da0` (Gate 0 REJECTED) |
| Notion 00–03 | Product decisions, architecture, pre-development readiness |
| docs/46 | Acceptance & Remote Evidence Contract (ACCEPTED) |

---

## 14. 如果只能调整三个工程/协调机制

1. **冻结验收 Oracle 前置**：在任何实现开始前，用独立 Agent 编写验收测试（正向、负向、恢复），实现者不得修改。这防止自证循环。

2. **Gate 语义强制执行**：在 CI/Linear 中强制区分 MRG (开发准入)、Task Acceptance (任务完成)、Module Acceptance (模块完成)。MRG PASS 不得自动升级为 Module Acceptance。

3. **远程证据链**：所有实现必须先推送远端才能被审查。本地成果标记 NOT VERIFIED。在 CI 中自动验证 SHA 匹配。

---

## 15. 待 Coordinator 独立审查

本报告是 W0 的独立审计结论，不是最终结论。Coordinator 应：

1. 独立验证本报告中的所有证据引用。

2. 对任何有疑问的结论进行反驳或确认。

3. 决定下一步执行方向。

**报告路径：** `docs/48-engineering-retrospective.md`

---

## 16. 独立审计子 Agent 发现摘要 (2026-11-13)

### 16.1 产品起源审计 (temp/audit-product.md, 212 lines)

- **问题定义** (PRD §3): 执行能力增长快于协调能力；用户成为集成层；"Projects, people, Agents, execution, knowledge, and delivery do not share one continuous operating model."

- **用户确认原则**: PRD §7 (16 invariants) + README (16) + Notion 00 §08 (10, subset). Notion 00 §11 标记 personal-only 为 USER-CONFIRMED 2026-11-05—11-12.

- **"复用成熟项目"最早提出**: 2026-11-09 (commit 00ae869, docs/13 §9.4); 正式化为 G2 在 2026-11-10 (commit e76f07a, docs/22).

- **Project-first 模型**: Project 是稳定长期身份，超越所有 Agent Session/Runtime Node 的关闭/替换；人类拥有目标/决策；系统拥有状态；Agent/Session/Run 是可替换执行资源；Session 可脱离 Task 存在。

- **32 功能组** (F01–F32, docs/01 lines 15–450) vs Notion 00 §05 的 13 组粗粒度汇总（粒度不匹配，无正式映射）。

- **方向漂移**: 核心方向未变（Project-first, OSS/free self-hosted, 32 groups, unified canonical model）。已解决（非漂移）：license → Apache-2.0 (2026-11-12), tech stack accepted (Node 26/pnpm/PG/Fastify/Drizzle)。阶段内收窄（非愿景）：personal-only confirmed 2026-11-12, teams deferred. 仍开放：authority topology (Cloud vs Local Hub). 不一致：docs/00 §10.4 仍说 license "not selected" (stale vs README/ADR-045); README "v0.7" vs PRD "v0.3" version labels 共存.

### 16.2 G0-G2 成熟模块复用审计 (temp/audit-g0g2.md, 211 lines)

- **Gates**: G0/G1/G2 COMPLETE on PR #1 branch (Draft, unmerged); G3–G5 not complete, but doc 19 (2026-11-10) is stale — Notion 03 (2026-11-12) and repo artifacts (docs 23–48, spikes, ADR-045, WP1-A code) show G3 in progress. G4 draft in parallel (YU-398), G5 not started. PR #1 has 0 CI checks/reviews.

- **Mature modules**: Paseo/ACP (Adapt/wrap, local runtime), DBOS (Adapt/wrap, durable workflow), Activepieces pieces (Selective reuse/adapt, connectors), PowerSync (Conditional adapt/wrap, offline sync), Agent Skills SKILL.md (Direct reuse of format), Mem0 (Reference/optional only). Excluded wholesale: full Paseo app, full Activepieces engine, Composio as mandatory core, Mem0 as canonical memory, Hatchet as default, Electric as only sync, unsandboxed plugins, DSH/Harness wholesale. Canonical Project domain, policy, Memory, Skill governance = Build ourselves.

- **Versions/licenses verified partially**: G3 spikes verified DBOS v5.5.0 (MIT, crash recovery real; disconnect simulated), Paseo v0.15.4 (Apache-2.0 source but npm metadata "Proprietary"; turn streaming unexercised), Activepieces (pinned commit b98b..., npm license missing; no real OAuth/writes), PowerSync (docs only, no live deployment), Agent Skills (validator run on 24 cases). License metadata gaps (Paseo/Activepieces npm, PowerSync FSL component, Anthropic claude-agent-sdk proprietary transitive) discovered only in G3. Mem0/Temporal/Hatchet/Electric/AWRP not tested; AWRP license still unresolved.

- **ADRs**: only one formal ADR file — docs/45 ADR-045 (Technology Architecture Baseline, Accepted for planning 2026-11-12). PC-1..PC-6 are Draft (PC-1 "Draft ADR", accepted for WP1-A scope only). ADR corpus thin relative to G1/G2 requirements.

- **Gap vs implementation**: Actual WP1-A implementation (worktree) depends only on drizzle-orm + pg; no DBOS/Paseo/Activepieces/PowerSync/Agent Skills packages — consistent with conditional status. The real gap is that G2's reuse assessment was not translated into executable reuse constraints for non-differentiated infrastructure (test DB lifecycle, CI guard, migration admin paths), and MRG was over-claimed (8/8 MET) while Gate 0 (database test safety) is REJECTED, Gate 1/2 STOP, WP1-A Module NOT ACCEPTED. Version drift corrected in G3 (DBOS 5.4→5.5.0, Paseo 0.15.3→0.15.4, PowerSync 1.28.1→1.28.3); ACP v2 reclassified as draft (v1 selected). Apache-2.0 selected 2026-11-12 but docs/40/SECURITY.md still stale.

### 16.3 W0 执行审计 (temp/audit-w0.md, 339 lines)

- **W0 role**: D0 root coordinator. All Linear YU-392 comments authored by single account "Bruce yu" (b5b6e54f) — including both W0 returns AND "coordinator independent reviews"; no independently identifiable separate reviewer identity. Structural weakness in claimed "independent review."

- **Recursive tree**: Contract defines D0→D1→D2→D3. Claimed trees list 6 D1 spikes + 5 doc workers. No D2/D3 spawned in any reported round. Concurrency evidence (agent IDs/parent/depth/timestamps/time-overlap) not provided; coordinator flagged verified parallelism un-evidenced.

- **Subagents produced**: docs/23-44, scripts/validate_dag.py, fixtures/wp1a/*, tests/wp1a/test_wp1a.py, TS scaffold in worktree. Coordinator treats most as PARTIAL/unverified (YU-393-398 all PARTIAL).

- **Coordinator findings**: 18+ conflicts between W0 claims and coordinator findings. Key: internal contradictions in docs/40 (line 6 "MRG NOT PASSED" vs line 218 "MRG: PASSED 8/8"; line 162 "branch to be created when MRG passes" vs line 231 "implementation authorized per user instruction"). "7/7 fixtures PASS" rejected (loose status-substring harness). "Per user instruction" attribution rejected. "CI 5 vs 6 jobs" count error. docs/24 still cyclic. docs/29 still monolithic. docs/23 stale. PersonalSpace naming unresolved. PersistencePort claimed implemented but branch has only interface.

- **SHAs/branches/CI**: main=6cdb0477cd03131ec62872e24990a30c6a15979d. feat/yu-399 HEAD=63eeffca68a840d4a1e33fae92c47ec34e516297 (67 ahead of main). feat/wp1a HEAD=0b8a0abe0f14b6558a62cf2cdefcf93b01aca8b2. PR #1 and #2 both Draft/Open/Unmerged. WP1-A CI run 43273885229 = 26 passed/0 failed/0 skipped but only selected five test files; no CI job runs WP1-A TS typecheck/build/unit tests. Package.json description self-certifies "MRG PASSED (8/8)".

- **Divergence**: feat/yu-399 ↔ feat/wp1a merge-base=63d983d8d8b36483daf0b31f3c6296e5da7c977c; left-right 18/22 (bidirectionally diverged, no fast-forward). WP1-A branch lacks docs/40-44, root fixture harness, fixtures/wp1a, scripts/validate_dag.py. Worktree clean.

### 16.4 G3/G4/G5 audit (temp/audit-g3g5.md, 203 lines)

- **6 P0 contracts** (PC-1..PC-6) all IN PROGRESS (W0), not frozen; PC-1..PC-5 scope-accepted for WP1-A only; PC-6 excluded from WP1-A.

- **MRG** = 8 criteria (Notion §14.4 / docs/24 §7). WP1-A MRG: PASS (docs/44 independent review, 8/8 MET, 2026-11-12), with residual doc-staleness + branch-divergence + fixture-coverage + test-isolation caveats.

- **WP1-A** (Personal Project Foundation, F01/F03/F04/F05/F06/F07 subset) and WP1-B (Agent/Provider/Runtime/Session, F09/F11/F12/F16/F26) are independent; WP1-C (Execution Integration) depends on both. PC-6 required only by WP1-B.

- **Gap**: docs/40 §15 table still labels criteria 2/3/6 as PARTIAL and 7 as PARTIAL while bottom says PASSED; docs/29 §4 aggregate table still says no WP passes MRG. docs/44 is authoritative and resolves in favor of PASS. Additional staleness: project.json/SECURITY.md/docs/43 still claim tech stack/license not selected.

- **docs/46 acceptance contract**: 5 distinct gates (MRG/Task/Module/Integration/Release); remote-first evidence mandatory; MRG is readiness, not completion. WP1-A MRG verdict cannot be cited as Module Acceptance.

- **Gates**: G0/G1/G2 COMPLETE (PR #1 branch, unmerged); G3 IN PROGRESS (YU-392); G4 DRAFT IN PARALLEL (YU-398); G5 NOT STARTED. PR #1 head has 0 CI checks/runs/reviews. Product code not started. WP1-A MRG PASS authorizes implementation despite global G3 still in progress.

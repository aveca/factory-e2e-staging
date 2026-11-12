# Factory V3 — Autonomous Desktop Operator E2E Contract

**Status:** acceptance specification only  
**Scope:** isolated staging; no production runtime changes  
**Date:** 2026-11-12

This document defines what must be demonstrated before Factory V3 can be described as a reliable Windows desktop operator. It is intentionally an acceptance contract, not a claim that any capability is already implemented.

## 1. Operating model

Factory V3 is the desktop operator. It observes the Windows desktop, selects tools, performs GUI or command-line actions, checks their outcomes, and continues or safely pauses.

ChatGPT is an optional assistant/tool: it may analyze evidence, prepare prompts, or review results. OpenCode, terminals, browsers, file managers, and other installed applications are tools Factory may operate. No single application or API is a mandatory control plane.

## 2. Evidence levels

Every reported capability must be labelled with one of these levels:

- **DISCOVERED** — application/window/process was identified.
- **ACTION_ATTEMPTED** — input was issued, but receipt is not yet proven.
- **RECEIVED** — the target application visibly or independently confirms receipt.
- **EXECUTED** — the target performed the requested operation.
- **VERIFIED** — output satisfies explicit acceptance criteria.
- **BLOCKED** — preconditions or evidence are unavailable.

A successful SendInput call, HTTP 200, visible click, or prompt paste alone must never be reported as task completion.

## 3. Desktop control safety

The desktop controller must enforce:

1. One exclusive GUI-action lease at a time.
2. Every action is bound to a verified target process, window handle, and expected window identity.
3. Revalidate the target immediately before typing or clicking.
4. Do not steal focus while recent user input is detected.
5. Do not type into a window whose identity or input field is uncertain.
6. Use bounded waits and cancellation; no unbounded polling loops.
7. Preserve clipboard contents and restore them only if the clipboard still contains the value written by the controller.
8. Record action IDs, timestamps, target window, intended operation, result, and evidence pointer.
9. A timeout after an ambiguous send must trigger a read/check before any retry.
10. Provide an explicit, tested emergency stop that prevents new actions and safely releases the GUI lease.

GUI actions are serialized even when independent background preparation or isolated worker processes run concurrently.

## 4. Application operation contract

### OpenCode

For an existing or newly opened session, record:

- application/process identity;
- session or conversation identity, when available;
- repository and working directory;
- branch;
- selected provider and model;
- target input control;
- prompt/action ID.

A prompt is **RECEIVED** only after the target session visibly or independently confirms it. A response is **VERIFIED** only after the complete response is captured and associated with the same action ID.

Factory may open a new session through the UI when required, but must not close or overwrite existing sessions to make room without an explicit policy.

### ChatGPT

ChatGPT may be opened and used through its available UI. Factory must distinguish the ChatGPT browser tab/window from bridge, developer-tools, and unrelated windows. A response must be associated with the originating conversation and action ID.

### Terminal and other applications

Commands must be scoped to an identified terminal and working directory. Command output, exit code, and resulting file changes are evidence. Shell execution must not be inferred from text displayed in a prompt or chat.

## 5. Mission lifecycle and recovery

Recommended lifecycle:

`QUEUED → CLAIMED → RUNNING → WAITING → VERIFYING → COMPLETED`

Other terminal or paused states:

`RETRY_WAIT`, `BLOCKED`, `FAILED`, `CANCELLED`.

Requirements:

- Persist mission state before and after externally visible actions.
- Use a unique mission ID and action ID for every side effect.
- Claim work with an exclusive lease and fencing token.
- A stale worker must be unable to commit state or issue new GUI actions after lease loss.
- On restart, reconcile uncertain actions against the target application before retrying.
- Never equate process liveness or heartbeat freshness with mission progress.
- A supervisor must not restart the whole desktop, browser, OpenCode, or model service as a generic recovery action.
- An empty queue may leave the supervisor idle and healthy; it must not be mistaken for a crash.

## 6. Model and provider provenance

Record separately for each session and each task:

- requested model/provider;
- UI-selected model/provider;
- session-configured model/provider;
- router-selected model/provider;
- effective model/provider, if independently observable;
- provenance and timestamp for each observation.

If these values disagree or the effective model cannot be proven, stop that task as **BLOCKED**. Do not silently substitute a fallback model or provider.

## 7. Required isolated E2E scenarios

Use disposable test windows, child processes, and test repositories only. Never kill or disrupt productive processes to simulate failure.

| ID | Scenario | Required proof |
|---|---|---|
| GUI-01 | Identify target window | PID, handle, title, process path, screenshot |
| GUI-02 | Focus safety | Recent user input causes a refusal; no focus theft |
| GUI-03 | Window movement | Move/resize only the verified test window |
| GUI-04 | Text entry | Unique nonce appears in the intended test input |
| GUI-05 | Send acknowledgement | Target confirms receipt of nonce exactly once |
| GUI-06 | Response capture | Complete response linked to the same action ID |
| GUI-07 | Clipboard race | User clipboard change is not overwritten on restore |
| GUI-08 | Window disappears | Action aborts safely; no input redirected elsewhere |
| FLOW-01 | OpenCode existing session | Prompt received and response associated with session |
| FLOW-02 | OpenCode new session | New disposable session opened through UI and verified |
| FLOW-03 | ChatGPT interaction | Correct conversation receives prompt and returns response |
| FLOW-04 | Terminal command | Working directory, command, output, exit code captured |
| REC-01 | Worker crash | Isolated mission resumes without duplicate side effect |
| REC-02 | Bridge outage | Bounded retry, explicit state, no blind resend |
| REC-03 | Stale lease | Old worker is fenced from further actions |
| REC-04 | Supervisor restart | Mission state reconciled before resuming |
| REC-05 | Duplicate event | Exactly one completion/side effect is recorded |

Each test must include setup, cleanup, assertion, raw evidence, and a clear PASS/FAIL/BLOCKED result. Do not report unexecuted tests as passing.

## 8. Acceptance gates

- **Gate A — Observation:** target applications and windows can be identified reliably.
- **Gate B — Safe interaction:** GUI actions are serialized, target-bound, and respect user activity.
- **Gate C — Verified execution:** receipt, execution, and result verification are separate states.
- **Gate D — Recovery:** isolated failure tests prove bounded, non-duplicating recovery.
- **Gate E — Desktop workflow:** a complete test workflow uses at least two applications and returns evidence.
- **Gate F — Sustained operation:** report actual observed uptime and mission throughput separately from simulated test results.

Do not claim 24/7 reliability from unit tests or a short smoke test.

## 9. Out of scope

This staging contract does not authorize:

- production deployment or merge;
- payment, checkout, price, or secret changes;
- bulk messaging or spending;
- stopping or restarting productive applications;
- disabling user-focus protections;
- enabling a paid API or automatic paid fallback.

## 10. Required test report

For each run, publish:

- commit SHA and test-run ID;
- machine/OS and relevant application versions;
- model/provider provenance;
- test IDs and results;
- timestamps and duration;
- evidence paths/hashes;
- known limitations;
- rollback/cleanup result.

The overall result is **COMPLETE** only when all required gates have direct evidence. Otherwise use **PARTIAL** or **BLOCKED** and identify the missing proof.

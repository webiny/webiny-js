# Investigation: debouncing summary jobs

Read-only investigation, run against the `feat/entry-activity-log` worktree with `origin/next`
merged in at `796cd01301`. Every file cited is at `next` state.

The Webiny MCP server was available and used (`get_started`, `webiny-api-tasks-catalog`).

Companion to [`entry-activity-log-ai-summaries-investigation.md`](./entry-activity-log-ai-summaries-investigation.md),
which established the surrounding facts about AI Powerups, field permissions and task payload
storage. Where that report's findings are extended or corrected here, it is called out.

No design proposed, no implementation written.

---

## Contents

1. [Task 1 — Replacing a pending task](#task-1--replacing-a-pending-task)
2. [Task 2 — Delayed dispatch](#task-2--delayed-dispatch)
3. [Task 3 — Cost and containment of repeated dispatch](#task-3--cost-and-containment-of-repeated-dispatch)
4. [Task 4 — selfCleanup coverage](#task-4--selfcleanup-coverage)
5. [Premises contradicted](#premises-contradicted)

---

## Task 1 — Replacing a pending task

### Querying by payload

**Not possible.** `IListTaskParamsWhere`
(`packages/background-tasks/src/api/types.ts:106-113`) permits filtering on exactly four fields:
`id`, `parentId`, `definitionId`, `taskStatus`. There is **no filter on `input`**, and the payload
is a `json` field (`packages/background-tasks/src/api/crud/TaskPrivateModel.ts:23`).

The query path is `TasksCrud.listTasks`
(`packages/background-tasks/src/api/crud/crud.tasks.ts:180-206`), which resolves
`ListLatestEntriesUseCase` against the private `wbyTask` model and maps the where through
`CmsWhereMapper` (`:191-194`).

**Cost.** On DynamoDB-only, `DdbListEntries` calls `queryAll`
(`packages/api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts:69`) and then filters, sorts
and slices in memory (`:168`) — so **every task entry in the tenant is read regardless of the
`where`**. On `ddb-es` it is an OpenSearch query. `getTask` by id (`crud/crud.tasks.ts:155-178`) is
a single `GetEntryByIdUseCase` read.

### Updating a pending task's payload

**Possible, and entirely unguarded.** `TasksCrud.updateTask`
(`packages/background-tasks/src/api/crud/crud.tasks.ts:255-288`) accepts `input`
(`types.ts:144`) and performs a plain `UpdateEntryUseCase` write (`:278-283`).

- **No status check.** Nothing prevents updating a task that has already begun executing.
- **No optimistic concurrency.** No version, etag or conditional write — last writer wins.
- `TaskService` itself does **not** expose update: `ITaskService` is `trigger`, `abort`,
  `fetchServiceInfo` only
  (`packages/api-core/src/features/task/TaskService/abstractions.ts:39-53`). Updating requires
  reaching past it to `TasksCrud`.

**What happens if execution begins during the update:** the runner reads the task into
`TaskManagerStore` at start and the handler receives `input` from that snapshot. A concurrent
`updateTask` writes the entry underneath it; there is no read-back and no conflict detection, so
the outcome depends purely on interleaving. Nothing in the code detects or reports it.

### States between trigger and execution

`TaskDataStatus` (`packages/background-tasks/src/api/types.ts:64-70`): `pending`, `running`,
`failed`, `success`, `aborted`.

`createTask` writes `PENDING` explicitly (`crud/crud.tasks.ts:234`). `RUNNING` is first written by
`runner/TaskManager.ts:53-58` when execution actually starts, or by
`response/DatabaseResponse.ts:81` on a continue.

All are queryable via `listTasks({ where: { taskStatus } })`. There is **no state between "created"
and "pending"** — the record is `PENDING` from creation, whether or not Step Functions has accepted
the execution.

### Existing code that modifies or cancels a pending task

`service.abort` (`packages/background-tasks/src/api/crud/service.tasks.ts:150-218`) is the only one.
It:

- rejects anything not `PENDING` or `RUNNING` (`:168-177`)
- creates a log if none exists (`:182-187`) — **unconditionally, ignoring `databaseLogs`**
- sets `taskStatus: ABORTED` via `updateTask` (`:189-191`)
- appends a log item (`:192-200`)
- calls `definition.onAbort` (`:204-208`), carrying a `TODO: determine when to kick off the onAbort
hook` at `:202-203`

**It never touches Step Functions.** The execution still fires; `TaskManager.run`
(`runner/TaskManager.ts:43-47`) then sees the stored status is `ABORTED` and returns without running
the handler. Abort is a flag the runner observes, not a cancellation.

### Cancelling or changing the Step Functions execution

**Absent.** `StepFunctionService` exposes only `send` (`:29`) and `fetch` (`:72`) —
`packages/background-tasks-aws/src/service/StepFunctionService.ts`. The SFN client wrapper imports
`StartExecutionCommand`, `DescribeExecutionCommand` and `ListExecutionsCommand`
(`packages/aws-sdk/src/client-sfn/index.ts:11-24`) — **there is no `StopExecutionCommand` anywhere
in the repo.**

Changing a running execution's input is not an operation Step Functions offers at all.

**However, the payload is not in the execution.** `StartExecution` carries only
`{ webinyTaskId, webinyTaskDefinitionId, tenant, delay }` (`StepFunctionService.ts:46-51`); the
runner reads `input` back from the task entry. So mutating the entry before execution does change
what the handler receives — Step Functions immutability is not the constraint here.

---

## Task 2 — Delayed dispatch

### How delay is implemented

**The task record is created immediately; execution is deferred.** The premise that delay is
first-class is correct, but the AWS implementation is not what it appears.

`trigger` creates the entry (`crud/service.tasks.ts:85`) then calls `service.send(task, delay)`
(`:93`), which puts `delay` into the Step Functions input (`StepFunctionService.ts:50`).

The state machine does **not** wait before the first run. `StartAt: "TransformEvent"` →
`Next: "Run"` (`packages/project-aws/src/pulumi/apps/api/backgroundTask/definition.ts:16,23`). The
Lambda is invoked immediately, and `TaskRunner.run` short-circuits:

```ts
if (rawEvent.delay && rawEvent.delay > 0) {
  return response.continue({ input: {}, wait: rawEvent.delay });
}
```

`packages/background-tasks/src/api/runner/TaskRunner.ts:67-72`

That returns to `CheckStatus`, which routes `status === "continue"` with `$.wait > 0` to the
`Waiter` state (`definition.ts:100-103`, `:131-135`), which then goes to `Run`.

**So a delayed task on AWS burns one full Lambda invocation purely to schedule the wait**, before
the handler has run at all. The cost of a delayed dispatch is: 1 CMS create + 1 `StartExecution` +
1 CMS update + **1 no-op Lambda invocation** + the Wait + the real Lambda invocation.

That short-circuit uses a plain `Response` (`TaskRunner.ts:50`), not `DatabaseResponse`, so it
writes nothing — the task stays `PENDING` through the delay window.

For completeness: `DatabaseResponse.continue` merges `{ ...task.input, ...params.input }`
(`response/DatabaseResponse.ts:76-82`), so the `input: {}` in the short-circuit would not clobber a
stored payload even if it did reach the database.

### Permitted range

`MAX_DELAY_DAYS = 355`, `MAX_DELAY_SECONDS = 30,672,000` (`crud/service.tasks.ts:25-26`).

`validateDelay` (`:33-50`) is looser than it looks:

```ts
if (!delay || delay < 0 || typeof delay !== "number" || Number.isInteger(delay) === false) {
    return;                       // accepted silently
} else if (delay < MAX_DELAY_SECONDS) {
    return;                       // accepted
}
throw new WebinyError(...);       // only >= 30,672,000 throws
```

**A negative delay and a fractional delay both pass validation** via the first branch and are
forwarded to the transport unchanged. Only a delay at or above the maximum throws
(`MAX_DELAY_ERROR`). Zero and `undefined` also take the first branch, which is correct for them.

### Queryable during the delay window

Yes, as `PENDING`, with its full `input` — via `getTask(id)` or
`listTasks({ where: { definitionId, taskStatus } })`. Nothing distinguishes a delayed pending task
from an undelayed one: the delay is not persisted on the record. The `wbyTask` model has no delay
field (`crud/TaskPrivateModel.ts:14-54`), and `ITaskUpdateData` has none (`types.ts:139-152`).

### Cancelling before it fires

`service.abort` works, since the task is `PENDING` (`:168-177`). Cost: 1 `getTask` read, 1
`getLatestLog` read, possibly 1 log create, 1 `updateTask` (which itself does a `getTask` read
first), 1 log update — so roughly **five CMS operations**. It does not stop the execution; the
Waiter still elapses and the Lambda still fires, then exits via `runner/TaskManager.ts:45-47`.

`deleteTask` (`crud/crud.tasks.ts:303-325`) also works and hard-deletes the entry. The execution
still fires and the runner then fails to find the task.

### Honoured on all runtimes

**Yes, but by different mechanisms.** The standalone runtime honours it in-process:
`WorkerTaskService.send` spawns a Node `Worker` **immediately**
(`packages/background-tasks-standalone/src/service/WorkerTaskService.ts:49`) and passes `delay`
through (`:96`); `worker/TaskOrchestrator.ts:35-36` then does
`await this.wait(this.taskEvent.delay * 1000)`.

So on standalone a delayed task **holds a worker thread for the entire delay**. A long delay pins a
worker; the 355-day ceiling is enforced identically but is meaningless there.

---

## Task 3 — Cost and containment of repeated dispatch

### Full cost of `taskService.trigger`

**The previous investigation's finding was incomplete.** One trigger performs, in order
(`crud/service.tasks.ts:54-118`):

1. `getDefinition` — in-memory (`:62`)
2. `validateTaskInput` (`crud/crud.tasks.ts:214-217`)
3. `definition.onBeforeTrigger` if defined (`:75-77`)
4. `validateDelay` (`:78`)
5. `createTask` (`:85`) → publishes `TaskBeforeCreateEvent`, performs **one CMS entry create**,
   publishes `TaskAfterCreateEvent` (`crud/crud.tasks.ts:222-249`)
6. `service.send` → **one Step Functions `StartExecution`** (`:93`)
7. `updateTask(task.id, { eventResponse: result })` (`:114-116`) → which itself does **one CMS entry
   read** (`getTask`, `crud/crud.tasks.ts:262`), publishes `TaskBeforeUpdateEvent`, and performs
   **one CMS entry update**

So: **three CMS operations (create, read, update) plus one `StartExecution`**, not one write plus
one call. On `ddb-es` each CMS write also becomes a stream-table write and a downstream indexing
invocation.

On failure of step 6, the task entry is deleted and the error rethrown (`:104-113`).

### Determining at execution time whether a newer task exists

**Only if the discriminator is one of the four filterable fields.** The query is
`TasksCrud.listTasks({ where: { definitionId, taskStatus } })` (`crud/crud.tasks.ts:180`). Payload
contents are not filterable (Task 1), so a per-target discriminator cannot be expressed in the where
— the caller would have to list by `definitionId` and inspect `input` on each returned task in
memory, at the read cost described above (full-table on DynamoDB-only).

`createdOn` ordering is available through `CmsEntryListParams` (`types.ts:115`), but the sortable
set is whatever the CMS exposes for the model.

### Aborting cleanly without recording a failure

**`controller.response.aborted()` writes nothing at all.** `DatabaseResponse.aborted()`
(`response/DatabaseResponse.ts:67-69`) delegates straight to the underlying response without an
`updateTask` — unlike `done()` (`:41-56`), which writes `SUCCESS`, `finishedOn` and `output`.

So a self-aborting task leaves the record in whatever state it was last written to — `RUNNING`, set
by `runner/TaskManager.ts:53-58` — with `finishedOn` unset. It records no failure, but it also
records no completion. `runner/TaskManager.ts:143-144` routes a handler returning
`TaskResultStatus.ABORTED` to the same place.

The only path that writes `ABORTED` is the external `service.abort`
(`crud/service.tasks.ts:190`).

### Does `selfCleanup` remove an aborted task

**Yes for the `onAbort` lifecycle event**, which `SelfCleaningTaskHandlerDecorator` wires at `:56-60`
(`packages/background-tasks/src/api/decorators/SelfCleaningTaskHandlerDecorator.ts`), distinct from
`onError` at `:50-54`.

Note the interaction with the finding above: a task that self-aborts via `response.aborted()` does
not necessarily reach `onAbort` through the decorator — the decorator's `onAbort` fires when the
lifecycle hook is invoked by the runner, and the status the record carries is `RUNNING`, not
`ABORTED`.

---

## Task 4 — selfCleanup coverage

### Which events can be asked for

Three, and only three: `ISelfCleanupEvent = "onSuccess" | "onError" | "onAbort"`
(`packages/api-core/src/features/task/TaskDefinition/abstractions.ts:115`), with `"always"` and
`"never"` as shorthands (`:117`). `normalizeSelfCleanup` expands `"always"` to exactly those three
(`packages/background-tasks/src/api/utils/normalizeSelfCleanup.ts:3-7`).

**Timeout and max-iterations are not separate events.** `onMaxIterations` exists as a lifecycle hook
(`decorators/SelfCleaningTaskHandlerDecorator.ts:34-36`) but is **not** wired to cleanup — the
decorator attaches cleanup only to `onDone`, `onError` and `onAbort` (`:42-60`).

Max-iterations is nonetheless covered _indirectly_: `runner/TaskManager.ts:72-84` resolves it to
`response.error({ message: "Task reached max iterations." })`, so a definition asking for `onError`
is cleaned up. A definition asking only for `onSuccess` is not.

A Lambda timeout mid-execution invokes no hook at all, so nothing is cleaned up.

### A task that is never executed

**Never cleaned up.** Cleanup fires only from the three lifecycle hooks, all invoked by the runner.
If dispatch succeeds and execution never starts, no hook runs. There is no sweeper and no TTL —
grep for `expiresAt`, `ttl`, `TTL` across `background-tasks/src/api` returns nothing. The record and
its payload persist indefinitely.

### Propagation to OpenSearch on ddb-es

**It does propagate, asynchronously.** `DdbEsDeleteEntry`
(`packages/api-headless-cms-ddb-es/src/operations/entry/DdbEsDeleteEntry.ts`) queries both the main
entity and the ES stream entity (`:30-42`) and issues deletes against both (`:44-59`). Actual index
removal is performed by the DynamoDB-stream consumer that also performs the writes, so it is
eventually consistent, not synchronous with the delete.

No indexed copy is _intentionally_ left behind, but the payload is present in OpenSearch for the
interval between write and delete propagation — and permanently if the stream consumer fails for
that record.

### What `cleanupTaskSubtree` removes, and what survives

`crud/cleanupTaskSubtree.ts` collects the root plus every descendant by walking
`listTasks({ where: { parentId } })` (`:12-39`), reverses to delete bottom-up, then per task deletes
logs and the task (`:66-78`).

**What survives it:**

1. **Logs of a self-cleaning task.** `deleteTaskLogs` returns early unless
   `definition.databaseLogs === true` (`:42-45`). But `TaskDefinitionDefaultsDecorator` forces
   `databaseLogs` to `false` for any task that asks for any cleanup event
   (`decorators/TaskDefinitionDefaultsDecorator.ts:45-52`). Meanwhile `service.abort` creates a log
   **unconditionally** (`crud/service.tasks.ts:182-187`), ignoring `databaseLogs`. So an externally
   aborted self-cleaning task gets a log that `cleanupTaskSubtree` then declines to delete. That log
   persists.
2. **Anything whose delete fails.** Every failure is logged and swallowed (`:53-57`, `:72-76`); the
   function never throws and never retries, so a partial cleanup is silent.
3. **Descendants created after collection.** The subtree is snapshotted at `:67` before deletion
   begins.

---

## Premises contradicted

1. **"One CMS entry write plus one Step Functions call"** — carried over from the previous
   investigation and **incomplete**. A trigger performs three CMS operations (create, read, update)
   plus the `StartExecution`, and publishes three domain events.
2. **"`validateDelay` … delay appears to be a first-class concept."** It is a concept, but
   validation only rejects delays at or above 355 days. Negative and fractional delays pass silently
   and reach the transport.
3. **Implicit premise that delay defers dispatch on AWS.** It does not. The Lambda is invoked
   immediately and returns a continue purely to enter the state machine's `Waiter`, so a delayed
   task costs an extra Lambda invocation before it does any work.
4. **Implicit premise that abort cancels execution.** It does not. Nothing in the repo can stop a
   Step Functions execution; abort only writes a status the runner later observes.

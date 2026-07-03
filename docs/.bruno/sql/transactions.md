# Transactions & Concurrency

How SQL transactions replace DDB's eventual consistency model, and the concurrency implications.

---

## Why Transactions

In DDB+OS, multi-step operations (publish, unpublish, moveToBin) are individual writes with no transaction wrapper. Partial failures produce temporarily inconsistent state that OpenSearch eventually reconciles.

SQL has no reconciliation sidecar. A failed `publish` that updated the old published row but not the new one leaves the entry in a broken state. SQL transactions prevent this — either all steps succeed or none do.

---

## Operations Requiring Transactions

| Operation | Steps | Why Transaction |
|---|---|---|
| `publish` | (1) Clear old isPublished, (2) update target row, (3) set live_version on all revisions, (4) sync entry-level meta | Partial failure leaves inconsistent published state |
| `unpublish` | (1) Clear isPublished on target, (2) clear live_version on all revisions, (3) sync entry-level meta | Partial failure leaves stale live_version |
| `createRevisionFrom` | (1) Clear isLatest on old revision, (2) insert new revision with isLatest=true | Partial failure leaves two latest or no latest |
| `moveToBin` | (1) Set wbyDeleted on all revisions, (2) clear isPublished, (3) store binOriginalFolderId | Partial failure leaves partially deleted entry |
| `restoreFromBin` | (1) Clear wbyDeleted on all revisions, (2) restore isLatest on max version | Partial failure leaves partially restored entry |
| `deleteRevision` | (1) Delete row, (2) optionally update new latest, (3) clear live_version if was published | Partial failure leaves no latest revision |
| `update` | (1) Update target row, (2) sync entry-level meta to all revisions | Partial failure leaves stale meta on other revisions |

Simple operations (`create`, `delete`, `deleteMultipleEntries`, `move`, single-row reads) don't need transactions.

---

## MVCC and Read Isolation

| Dialect | Default Isolation | Readers Blocked by Writers? |
|---|---|---|
| PostgreSQL | Read Committed | **No** — MVCC, readers see last committed version |
| MySQL InnoDB | Repeatable Read | **No** — MVCC, readers see a snapshot |
| SQLite | Serialized | **Yes** — single-writer blocks everything |

PostgreSQL and MySQL use MVCC (Multi-Version Concurrency Control). A concurrent read during a publish transaction sees the pre-publish state until the transaction commits. No lock contention.

---

## SQLite Single-Writer Locking

SQLite uses a single-writer model. When a write transaction is active, **all other connections are blocked** — both reads and writes.

### Impact

- A `publish` operation that updates multiple revisions blocks all concurrent requests for the duration
- Any write-heavy workload serializes completely
- Concurrent users experience degraded performance proportional to write frequency

### Severity

Depends on deployment:
- **Small self-hosted instance** (1-5 concurrent users) — likely acceptable
- **Medium workload** (10+ concurrent users writing content) — noticeable delays
- **High write frequency** (bulk imports, automated content) — severe bottleneck

### Possible Mitigations

- **WAL mode** (`PRAGMA journal_mode=WAL`) — allows concurrent reads during writes, but only one writer at a time. Readers see the pre-write state.
- **Short transactions** — keep write transactions as brief as possible
- **Connection pooling** — queue write requests through a single connection

WAL mode is the minimum configuration for any production SQLite deployment.

---

## Race Conditions

### Concurrent Publish

Two requests try to publish different revisions of the same entry simultaneously.

Without transactions:
1. Request A reads: revision 3 is published
2. Request B reads: revision 3 is published
3. Request A: clears revision 3's isPublished, sets revision 5's isPublished
4. Request B: clears revision 3's isPublished (already cleared), sets revision 7's isPublished
5. Result: both revision 5 and 7 have isPublished=true — broken state

With transactions + row locking:
- Request A acquires lock on entryId rows
- Request B blocks until A commits
- Request B then sees the updated state and operates correctly

PostgreSQL/MySQL handle this naturally with `SELECT ... FOR UPDATE` or transaction isolation. SQLite serializes by design.

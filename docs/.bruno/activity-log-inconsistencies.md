# Activity log design — inconsistency review

**Status:** review notes, second pass
**Subject:** `docs/.bruno/activity-log.md` (21,559 bytes, read at 2026-09-09)
**Method:** first pass was internal consistency only. A second pass re-triaged every finding against
the codebase and against the document's own hedges; codebase claims are now verified with file:line
evidence, and four first-pass findings were withdrawn. Verdicts and severities below are the
second-pass ones.

Line references are `activity-log.md:NN` against the version read.

## Summary

The design is sound enough to review on the merits. Its central measurement is real, the code path it
describes checks out almost line for line, and its DynamoDB claims — TTL semantics, the 400 KB item
limit, LSI-at-creation-only, the 10 GB item-collection cap, the 3,000 RCU per-partition ceiling — are
all correct. The read-unit derivations reconcile to within 0.1% at decimal MB.

Thirty-two findings survive triage: 11 confirmed and 9 overstated from the first pass, plus 12 found
on the second. Four first-pass findings were **withdrawn as wrong** and are listed as such, because
one of them (D5) asserted a false fact about the codebase.

The four that actually affect the recommendation:

1. **N1** — the 7 GB/year storage figure is half the document's own record size. Correcting it to
   14.75 GB strengthens the case it supports.
2. **D3 + X5** — the three-operation storage interface can express neither the revision filter
   promised at `:94` nor the resumable purge mandated at `:41`.
3. **D1 + X2 + X3** — the revision-major sort key is irreversible, is never labelled as such, and
   rests on an assumption the code contradicts: an unlocked older revision can be saved after a newer
   one exists.
4. **X12** — capture has no atomicity and no stated failure policy, so the design cannot say whether
   the timeline is complete. This is the feature's whole value proposition, and it also bears on
   Question 2.

| ID | Finding | Verdict | Severity |
| --- | --- | --- | --- |
| N1 | 7 GB/year is half the document's own record size | confirmed | high |
| D1 | Revision-major sort order conflicts with the stated access pattern | confirmed | high |
| D3 | Storage interface cannot express the filters the design requires | confirmed | high |
| C2 | Actor filtering placed client-side and server-side | confirmed | high |
| X2 | Per-save granularity falsifies the ordering dismissal | new | high |
| X3 | Only one irreversible decision acknowledged; the sort key is not it | new | high |
| X5 | The delete operation cannot be driven by the task it mandates | new | high |
| X12 | Capture has no atomicity; the sort key precludes idempotent append | new | high |
| X1 | "It costs nothing" vs "The only cost is" | new | medium |
| X6 | Record shape omits revision, target type and target id | new | medium |
| X7 | The tier objection to audit logs applies to the recommendation | new | medium |
| U1 | Sort-key sentinel called "defined", never defined | confirmed | medium |
| U2 | Revision encoding for byte-ordered sort never specified | confirmed | medium |
| C1 | One volume figure 25× outside the stated model | overstated | medium |
| C3 | Differ abstraction rejected and adopted in one paragraph | overstated | medium |
| C6 | Observed/inferred boundary not marked on the memory conclusion | overstated | medium |
| D2 | SQL section under-specifies the index and ordering contract | overstated | medium |
| X11 | `:51` describes a base-table partition; the code queries a GSI | new | medium |
| N4 | "A few hundred megabytes of information" does not follow | confirmed | low |
| D4 | "Target" becomes "target entry" in the SQL section | confirmed | low |
| U3 | Cursor opacity across two backends never specified | confirmed | low |
| P2 | "Two investigations" does not match the document's contents | confirmed | low |
| P3 | An acknowledged unknown is not carried into Open questions | confirmed | low |
| X4 | `:110` files two reversible decisions under "irreversible" | new | low |
| X8 | GSI rejected on a cost the document elsewhere waves through | new | low |
| X9 | TTL paragraph undercuts the LSI's "no expiry" premise | new | low |
| X10 | `:27` denies a capability the design then specifies | new | low |
| N3 | 10 GB partition ceiling unreachable under stated volumes | overstated | low |
| C4 | `:86` labels the feature "business tier" | overstated | low |
| N2 | "A couple of megabytes" for 2,000 records | overstated | low |
| P1 | Offset pagination's causal weight overstated at `:39` | overstated | low |
| D6 | "Both backends" where the document counts three | overstated | editorial |
| ~~C5~~ | ~~Recommendation settled then reopened~~ | **withdrawn** | — |
| ~~N5~~ | ~~Field counts never reconcile~~ | **withdrawn** | — |
| ~~D5~~ | ~~Locale absent from both key structures~~ | **withdrawn** | — |
| ~~P4~~ | ~~Emulator latency dismissed then used as evidence~~ | **withdrawn** | — |

---

## Relationship to event sourcing

Worth stating up front, because the shape invites the comparison and the comparison locates X12. The
key layout at `:33` — one partition per aggregate, a sort key of sequence-then-time, immutable on
write (`:27`), no expiry (`:37`) — is the canonical DynamoDB event-store layout.

The semantics are not event sourcing, and the design is right not to claim they are. The defining test
is whether current state can be discarded and rebuilt by folding the log. It cannot: `:15` stores
"field paths and per-field content hashes, never content values", so a record says *that* `title`
changed and never *to what*. The entry and its revisions remain the system of record, and `:15` sends
editors to the version compare feature when they need values. This is a derived change trail — the
statement, not the ledger.

Two consequences follow, and only the first is in the document.

**Intra-revision history is not recoverable.** Granularity is per save (`:15`) but values are kept per
revision, so the timeline can report that two people changed the same field twenty minutes apart while
only the final value survives anywhere. That is a deliberate trade, and the hashes buy one thing back:
a field whose hash returns to an earlier value demonstrates a revert, which a values-free log has no
other way to express. Worth saying explicitly, since it is a real limit on what the UI can offer and
`:15` states the mechanism without stating the consequence.

**Nothing guarantees the log is complete.** An event store cannot lose an event, because the append
*is* the state change. Here they are two separate writes. See X12.

The document also passes over the mechanism that would give lossless capture without touching the save
path. `:80` treats DynamoDB Streams purely as a cost — "a stream table write, a stream event, a Lambda
invocation" — inside the OpenSearch argument, without noting that the same mechanism is the standard
at-least-once change-capture path, and that capturing from the stream rather than from the entry event
layer would decouple the append from the save entirely. Whether that is worth the added latency and
the at-least-once dedupe burden is a genuine trade-off. The document does not make it, and having
already described the stream as pure overhead it is unlikely to be raised in review.

---

## Confirmed — high

### N1 — The 7 GB/year figure uses half the stated record size

`:82` — "One activity record costs one batch write, two DynamoDB items, 4,041 bytes and four write
units... An installation doing ten thousand saves a day accumulates roughly 7 GB a year."

10,000 × 4,041 × 365 = **14.75 GB**. Seven GB is 10,000 × 2,020 × 365 — one item of the two. The
figure appears to have been derived from the read-side per-item size instead of the write-side
per-record size. The document's other figures are internally consistent in a way that makes this easy
to localise: 4,041 bytes over two items is 2,020 per item, and every row of the read table is 2,020
bytes per item read (202,000,000 / 100,000 at `:59`).

This is the headline cost of the write-path waste that motivates leaving the entry layer, and it is
understated by half. Correcting it strengthens the recommendation.

### D1 — Revision-major sort order conflicts with the stated access pattern

`:21` — the access pattern is "All records for one target, ordered by time, newest first, paginated.
This is every timeline view."

`:33` — "Sort key on revision, then timestamp, then a uniqueness suffix, descending reads by default."

A revision-leading sort key returns revision-major order, not time order. `:94` acknowledges this and
dismisses it because revisions are created in increasing order — but that reasoning is about
*creation* order, and the failure case is a save to an older revision while a newer one exists.

**Verified in code:** revision creation is monotonic
(`packages/api-headless-cms/src/utils/incrementEntryIdVersion.ts:17`, `version + 1`), but
`packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts:38-48` fetches
whatever revision id the caller passes and rejects only if `originalEntry.locked`. Locking is applied
on publish, so an unlocked earlier revision can be updated after a later one exists. `:94` calls this
"worth confirming"; it is confirmed, and it goes the wrong way. See also X2 and X3.

### D3 — The storage interface cannot express the filters the design requires

`:22` — the access pattern includes "Occasionally filtered by revision or actor within that set."
`:90`–`:98` — an entire section on those two filters.

`:128`–`:133` — the interface: append one record; "List records for one target entry, newest first,
with a cursor and a limit"; delete all records for one target entry.

There is no filter parameter. If filtering happens above the interface then `:94`'s claim that
revision filtering is "a key condition" is unreachable — the storage layer is never told the revision.
If it happens below, the signature is incomplete.

### C2 — Actor filtering is placed both client-side and server-side

`:35` — "Filtering by actor or action applies to a page that has already been fetched, and no query
crosses entries."

`:96` — "Actor is an attribute, so DynamoDB applies it after reading and before the limit. The read
still costs up to a megabyte per request regardless of how many records survive."

These describe different systems. Under `:35` the filter runs on already-returned data and costs
nothing extra; under `:96` it is a `FilterExpression` with multi-round-trip consequences. `:35` is
load-bearing — it is the justification for shipping no GSI.

Two errors inside `:96`, worth fixing at the same time:

- Order of operations is reversed. DynamoDB applies `Limit` to items *examined* and the filter after;
  a filter does not run "before the limit".
- "Up to a megabyte per request" is the unlimited-scan figure. A query carrying `Limit: 50` reads
  about 50 items and filters those. The document asserts both behaviours in one sentence.

`:35` also introduces filtering by **action**, which `:92` ("Two filters are expected in the UI: by
revision, and by actor") excludes.

---

## New — high

### X2 — The document's own rationale for per-save granularity falsifies its ordering dismissal

`:15` — "Granularity is per save rather than per revision, **because a single revision is often worked
on for days by several people**."

`:94` — "Revisions are created in increasing order, so those two orderings coincide unless the CMS has
a path that produces a revision out of sequence."

A revision worked on for days, while other revisions of the same entry are also being saved, produces
saves interleaved in time across revisions. No out-of-sequence revision *creation* is required — the
premise for the feature's granularity is itself the counterexample to the dismissal, from the
document's own evidence. Under revision-major descending order the newest save in the entry is not
the first row returned.

### X3 — Only one irreversible decision is acknowledged, and the sort key is not it

`:92` — "the difference is worth stating because **it decides one thing that cannot be changed after
the table is created**" — singular, and `:100` makes it the LSI. `:142` repeats it: "the third cannot
be revisited once the table exists."

But `:33`'s sort key composition is equally unchangeable without rewriting every item, and by D1/X2 it
rests on an assumption the code contradicts. It appears nowhere in the irreversible set. Question 2
(`:148`, core table vs new table) is likewise a data-migration-scale decision presented as freely
open.

### X5 — The delete operation cannot be driven by the task it mandates

`:41` — "**Purge as a background task** ... `EmptyTrashBinTaskDefinition` is the template, including
**its timeout checks and continuation**."

`:43`/`:133` — "Delete all records for one target entry" — one unbounded call, no continuation token,
no resume point, no progress return. A task that must stop near timeout and resume cannot be built on
that signature.

Compounded at `:134`: "Purge is a delete by target entry id, which **does not need** the background
task the DynamoDB side requires, **though the task should be shared** and simply complete faster" —
one sentence declaring the task both unnecessary and mandatory.

### X12 — Capture has no atomicity, and the sort key precludes idempotent append

`:15` — "Records are captured at the entry event layer." `:82` — one activity record "costs one batch
write, two DynamoDB items, 4,041 bytes and four write units ... adding about 2 ms of in-process work
plus one round trip to a save."

The append and the entry save are two separate writes, and `:82`'s "one batch write" is a
`BatchWriteItem`, which is not atomic even within itself. The document never says what happens when
one of the two fails. Both directions are unhandled:

- **Loss.** The save commits, the append fails, and the timeline is silently short a record. Nothing
  can detect it, because there is no sequence number in which a gap would show — the sort key is
  revision + timestamp + uniqueness suffix (`:33`), dense in neither dimension. The timeline's entire
  value is that it is complete, and the design cannot say whether it is.
- **Duplication.** A retried save — a client retry, or a Lambda retry on the same event — appends a
  second record for one change. The "uniqueness suffix" at `:33` guarantees the two will not collide,
  so they are stored as two records rather than deduplicated. That suffix exists to make appends
  collision-free, which is the opposite of making them idempotent. The correlation id at `:108` is the
  natural dedupe key and is never used as one.

This also bears on Question 2 (`:148`) in a way the document does not note. Atomic capture requires
`TransactWriteItems`, which can span tables in one account and region but costs twice the write units
and would move the entry save off the `BatchWriteItem` path `:82` measures. A shared core table does
not by itself buy atomicity, but it removes the cross-table hop and makes a single transaction a
smaller change. That is a point in Question 2's favour that the recommendation does not weigh.

At minimum the document should state the failure policy — drop the record, retry it, or fail the save —
and say whether the timeline claims completeness. For a feature shipping at enterprise tier next to
audit logs, that is a product decision as much as a technical one, and it belongs in Open questions.

---

## New — medium

### X1 — "It costs nothing" vs "The only cost is"

`:33` — "Putting revision in the sort key is what makes 'show me everything on version 5' a key
condition rather than a filter, **and it costs nothing**, as explained in the filtering section below."

`:94` — "**The only cost is** that the natural ordering becomes revision then time rather than pure
time."

The section the recommendation forward-references to prove there is no cost is the section that names
the cost.

### X6 — The record shape omits revision, target type and target id

`:108` — "So is the record shape: timestamp, actor, action, source label, correlation id, and a set of
changed paths with hashes."

`:33` makes revision the *leading* sort-key component; `:110` claims "a record always says what it
refers to". Revision, target type and target id are all absent from the stated shape, in the section
whose purpose is to fix what generalises unchanged across sources.

### X7 — The tier objection to the audit logs table applies to the recommendation

`:86` rejects sharing that table because "Sharing the table would mean deploying audit logs
infrastructure to business tier customers who have not bought audit logs."

`:146` requires the opposite for the new table: "the table cannot be conditional on an enterprise
package" — deployed to every customer, including, per `:15` ("enterprise tier initially"), every
customer who cannot yet use the feature. Deploying unused infrastructure to non-purchasers is
disqualifying for the alternative and mandatory for the recommendation. `:146` then undercuts its own
prohibition by asking "whether conditional deployment is available and desirable".

### X11 — `:51` describes a base-table partition; the code queries a GSI

`:51` — "listing entries filtered by a field value **queries the model partition** with no limit."

**Verified:** `packages/api-headless-cms-ddb/src/operations/entry/DdbListEntries.ts:61-65` queries
`index: "GSI1"` with `createGSIPartitionKey(model, type)`. The conclusion is unaffected — `queryAll`
still loops to exhaustion and the filter still runs in JavaScript — but the byte accounting differs,
since a GSI returns projected attributes rather than full items. The measured byte counts are the
document's strongest evidence, so the read path they came from should be named correctly.

---

## Confirmed — undefined but claimed defined

### U1 — The sort-key sentinel (medium)

`:33` — "with a defined sentinel for sources that have no version dimension." `:110` — "The sort key
has defined behaviour for targets with no version dimension", listed under "What is settled now
because it is irreversible."

The value is never given. A sentinel in a sort key must sort correctly against real revision values
under descending reads, which constrains it. Naming it is a one-line change and it belongs in the
irreversible set.

### U2 — Revision encoding (medium)

`:33` puts revision first in a three-part composite sort key, which must therefore be a String, so
UTF-8 byte ordering applies and an unpadded `10` sorts before `5`. Nothing specifies zero-padding or a
fixed width. Every ordering claim at `:94` depends on it, and it cannot change after the first write.

**The concern is live in this codebase:** `packages/api-headless-cms-ddb/src/operations/entry/keys.ts`
imports `zeroPad` and `createRevisionSortKey` returns `REV#${zeroPad(params.version)}` — the CMS
already solves exactly this problem, and the document does not mention it.

### U3 — Cursor opacity across two backends (low)

`:39` mandates "the DynamoDB pagination key"; `:134` mandates keyset pagination on SQL; `:131` takes
"a cursor". The document never states the cursor is opaque and backend-encoded, which is the only way
one signature covers both — and cursor shape is named at `:138` as a place where the two will drift.

---

## Confirmed — low

### N4 — "A few hundred megabytes of information" does not follow

`:82` — 10,000 saves/day for a year is 3.65 M records. At "a few hundred bytes" of payload that is
0.7–1.5 GB. Only a payload near 100 bytes lands in the stated range.

### D4 — "Target" becomes "target entry" in the SQL section

`:25` — "'Target' means a content entry in v1. It is written this way because pages, templates and
files want the identical pattern." Then `:131`, `:133` and `:134` say "one target entry" and "target
entry id". The one section that defines the storage contract is written in entry terms, which is
where the generalisation at `:110` most needs to hold.

### P2 — "Two investigations" does not match the contents

`:7` — "Two investigations were run against the codebase before anything was designed, and both
changed the answer." `:47` and `:170` then say "the investigation", singular. The document presents at
least five lines of inquiry: read cost on DDB-only, OpenSearch indexing, write cost through the entry
layer, the segmented model, and the audit logs table. As the opening claim to authority it should be
checkable.

### P3 — An acknowledged unknown is not carried into Open questions

`:94`'s "which is worth confirming" appears in none of the six open questions, while three weaker
unknowns do (Q3 usage, Q5 write patterns, Q6 SQL mechanisms). By D1/X2 it is the assumption the
primary access pattern rests on.

### X4 — `:110` files two reversible decisions under "irreversible"

The section headed "What is settled now because it is irreversible" includes "The GraphQL query takes
a target type and a target id rather than an entry id, so adding a source is not a breaking API
change" — a GraphQL argument can be added and deprecated at any time — and "Action values are
namespaced per source", a value convention a read-time mapping can migrate. Meanwhile the genuinely
irreversible sort-key composition is absent (X3).

### X8 — The GSI is rejected on a cost the document elsewhere waves through

`:35` — "A GSI on an append-only dataset doubles the write cost, and nothing currently needs one."

At a few-hundred-byte record, one GSI projection adds roughly one write unit per save. `:82` waves
through the entry layer's *four* write units and 2 ms, and `:162` argues per-entry write volume "stays
well inside per-partition limits, since it is bounded by how fast humans and jobs can save". The
second clause ("nothing currently needs one") carries the argument; the first is proportionally true
but immaterial in absolute terms.

### X9 — The TTL paragraph undercuts the LSI's "no expiry" premise

`:100`/`:102` reject the LSI partly because 10 GB is "a real ceiling on a dataset with **no expiry**",
and "a permanent dataset should not accept a partition ceiling". `:37` — "adding it later for a subset
remains possible." If expiry is available later, permanence is a policy choice rather than the
structural constraint the rejection treats it as.

### X10 — `:27` denies a capability the design then specifies

`:27` — "Nothing queries across targets. **Nothing searches record contents.** Nothing updates a
record after it is written." Actor filtering is a predicate over record contents and is the subject of
an entire section. Pedantic in isolation, except that `:19` calls the list "the whole of it, and the
narrowness is what makes the design straightforward", so its precision is load-bearing.

---

## Overstated on the first pass — reframed

### C1 — One volume figure is 25× outside the stated model (was: three incompatible statements)

`:68` sets the model: "around 100 activity records" average, "the extreme case ... reaches 2,000".

Only one passage breaks it. `:96` — "On one with fifty thousand where the actor touched twelve, it is
many requests returning almost nothing" — is 25× the stated extreme, in the passage that sets up the
LSI decision at `:100`. Correction to the first pass: `:41`'s "thousands of records" is consistent
with an extreme of 2,000, and `:154` restates `:68` rather than contradicting it. And `:102`
recommends shipping without the LSI regardless, so no argument dissolves — a stray illustrative number
needs deleting.

### C3 — The differ abstraction is rejected and adopted in one paragraph

`:118` — "no abstraction over differs with a single implementation behind it", then two sentences
later: "The CMS differ sits behind a plain interface so a second implementation can join it." An
interface with one implementation behind it is what the first sentence rules out. Editorial, but in a
paragraph about what is deliberately not built.

Correction to the first pass: the document is *not* inconsistent about applying this rule to storage,
because it states the asymmetry — `:124` "Standalone deployments use the SQL backend, so a second
implementation is needed" against `:106` "None of that is committed, and none of it is built now".

### C6 — The observed/inferred boundary is not marked

`:62` says the million-record row "is extrapolated; the rest were measured", so 100,000 completed —
against dynalite, where `:62` certifies only item, byte and request counts. `:78` then states "100,000
is already past the memory ceiling" and `:172` states the OOM kill as established fact. There is no
contradiction once the environment is accounted for, but the document never marks which memory
conclusions are observed under the deployed configuration and which are inferred.

### D2 — The SQL section under-specifies the index and ordering contract

`:134` gives SQL "a composite index on tenant, target entry id and timestamp descending" — no
revision, so the revision filter cannot come from the index and the natural order is pure time, while
DynamoDB's is revision-then-time. `:138` requires both implementations to pass one interface test
suite "or they will drift in ordering and pagination behaviour".

Correction to the first pass: this is a specification gap, not a design impossibility. A SQL index and
an `ORDER BY` can be changed at any time; the asymmetry the whole `:92`–`:100` section rests on is
that a DynamoDB sort key cannot.

### N3 — The 10 GB ceiling is a hygiene argument, not an arithmetic error

The arithmetic holds: the partition is one target (`:33`), so at a few hundred bytes per record 10 GB
is on the order of 20 million records for a single entry — four orders of magnitude past the stated
extreme. (The limit is an item-collection limit and counts LSI projections, so base-item capacity is
lower, but still millions.) `:100` already concedes the magnitude in the same sentence — "which is a
large number of records but is a real ceiling on a dataset with no expiry" — so this is an
architectural-hygiene claim about an unbounded dataset, not a volume claim. It is weakened by X9, not
by the arithmetic.

### C4 — `:86` labels the feature "business tier"

`:15` sequences the tiers — "enterprise tier initially, with the intention of extending it to business
tier" — which reconciles `:146`. The defect is the single phrase "a business tier feature" at `:86`,
which should read "a feature intended for business tier". The substantive problem in this area is X7,
not the label.

### N2 — "A couple of megabytes" for 2,000 records

`:154` — "filtering by actor after the read costs a couple of megabytes at worst." At the top of "a
few hundred bytes" (≈900 B), 2,000 records is 1.8 MB, which is a couple of megabytes; and DynamoDB
bills filtered reads in 4 KB increments per request, which pushes the effective figure up. The
first-pass claim depended on choosing 300–400 B. Withdrawn as a numerical error; what remains is that
the per-record size behind the estimate is never stated.

### P1 — Offset pagination's causal weight

`:39` — "the CMS entry list uses an offset, and that behaviour is **part of** why the private model
failed."

The measured cost is driven by the unbounded read plus the JavaScript filter and sort (`:51`), and
`:64` reports identical cost at every offset. But the two are coupled: `DdbListEntries` must
materialise, filter and sort the whole set *because* its contract is `slice(start, end)` on a numeric
offset — verified at `DdbListEntries.ts:168`. The hedge "part of" is defensible; the first pass
overstated it as a cause the offset "cannot" be. What is worth fixing is that `:39` does not say where
the causal weight sits, and calling `:174` a separate defect understates the link — `:174` is a
different defect of the same offset cursor.

### D6 — "Both backends" (editorial)

`:84` — reads by id "go straight to DynamoDB on both backends". SQL is not a DynamoDB backend, so
"both" can only mean DDB-only and DDB-ES and no reader is misled. What remains is that "backend" means
the storage-operations backend at `:51`/`:80` and the AWS/standalone split at `:124`/`:138`.

---

## Withdrawn as wrong

**D5 — "Locale is absent from both key structures."** The first pass asserted that "Headless CMS data
is partitioned by tenant *and* locale throughout Webiny". That is false.
`packages/api-headless-cms-ddb/src/operations/entry/keys.ts:12` builds `T#${tenant}#CMS#CME` and
:18-22 appends only the parsed entry id; `packages/api-headless-cms-ddb-es/src/operations/entry/keys.ts`
is identical; the string `locale` does not appear anywhere in
`packages/api-headless-cms-ddb/src/operations/entry/`, at the investigation base commit or on `next`.
The proposed tenant + target-type + target-id partition key mirrors the CMS's own key exactly. The
document's silence is the consistent choice.

**C5 — "Recommendation presented as settled, then reopened by Q2."** The document flags this itself:
`:88` — "Its costs are new infrastructure, an upgrade path, and a storage implementation per backend.
The first two are the open questions below" — and `:142` repeats it. A yes to Question 2 also changes
only where the items live; the key structure, no-GSI, no-TTL, cursor pagination, background purge and
the three-operation interface all survive. Any residue is that the Recommendation heading does not
itself carry the conditionality `:88` supplies.

**N5 — "Field counts never reconcile."** `:82`'s "ten small fields" describes the record as stored in
the *rejected private model*; `:108`'s six-element list is the generalised shape for the *dedicated
table* and is scoped to "What generalises unchanged". Different artefacts in different designs, and
they reconcile arithmetically (the six plus tenant, target type, target id and revision is ten). What
remains is a provenance question about "ten" and "twenty-eight", not an inconsistency. See X6 for the
real problem with `:108`.

**P4 — "Emulator latency dismissed, then used as evidence."** `:62`'s caveat is scoped to "absolute
**latency**"; `:82` claims "about 2 ms of **in-process work** plus one round trip", i.e. application
CPU work, which no database emulator affects, plus a round-trip *count*, which `:62` explicitly
certifies. The document already rests the conclusion on the round-trip count — the fix the first pass
demanded. The residual wrinkle is that 2 ms on a dev machine is not 2 ms on a Lambda vCPU.

---

## Codebase claims — verification

| Claim | Verdict | Evidence |
| --- | --- | --- |
| `EmptyTrashBinTaskDefinition` exists, with timeout checks and continuation (`:41`) | VERIFIED | `packages/api-headless-cms-bulk-actions/src/tasks/EmptyTrashBinTaskDefinition.ts:134`; `isAborted()` :54; `isCloseToTimeout()` :68, :73, :101, :106; `maxIterations = 120` :34; `response.continue({...input, executedTenantIds})` :123 |
| ddb-es writes to OpenSearch unconditionally (`:80`) | VERIFIED | `packages/api-headless-cms-ddb-es/src/operations/entry/DdbEsCreateEntry.ts:120-140` — `esEntity.createEntityWriter({ put: [...] })` with no model-level conditional |
| Per-model index hook offers no way to decline (`:80`) | VERIFIED | `packages/api-headless-cms-utils-os/src/features/CmsModelOpenSearchIndex/CmsModelOpenSearchIndexProvider.ts:5-9` — `{ index, settings, shared }`, no opt-out |
| Private models included in index creation by default (`:80`) | VERIFIED | `packages/api-headless-cms-ddb-es/src/tasks/CreateElasticsearchIndexTask.ts:15` calls `listModels.execute()` with no params; `ListModelsRepository.ts:22` — `includePrivate = params?.includePrivate !== false` |
| DDB-only list loads the whole partition, filters and sorts in JS, no limit pushed down (`:51`, `:172`) | VERIFIED, with X11 | `DdbListEntries.ts:69` `queryAll` no limit; `packages/db-dynamodb/src/utils/query.ts:107-118` loops to exhaustion; `DdbListEntries.ts:138` JS filter, :157 JS sort, :168 `slice`. Partition is **GSI1**, not the base table |
| Cursor is an unconditional numeric offset alongside a separate `hasMoreItems` (`:174`) | VERIFIED | `DdbListEntries.ts:165-178` — `parseInt(decodeCursor(after) \|\| "0")`, `hasMoreItems = totalCount > start + limit`, `cursor = encodeCursor(...)` returned unconditionally |
| CMS partition keys include locale (basis of withdrawn D5) | CONTRADICTED | `packages/api-headless-cms-ddb/src/operations/entry/keys.ts:12` — `T#${tenant}#CMS#CME` |
| The CMS can save a revision out of time sequence (D1, X2, P3) | VERIFIED | `UpdateEntryUseCase.ts:38-48` rejects only on `originalEntry.locked`; locking applies on publish |
| Revision sort keys need padding (U2) | VERIFIED | `keys.ts` — `createRevisionSortKey` returns `REV#${zeroPad(version)}` |

Still unverified, each load-bearing: "Fourteen core features already do this" (`:47`); the
twenty-eight meta fields (`:82`); the 1 GB / 30 s Lambda configuration (`:66`); the capture filter
excluding private models (`:116`); that Website Builder pages and files are private CMS models
(`:116`). Also unchased: whether `CreateEntryRevisionFromDataFactory.ts:82`'s `latestId = sourceId`
fallback can yield a non-`latest+1` version, and whether import/export or migration paths write
versions directly.

## Defects found in the code while verifying

Not this feature's problem, and separate from the two the document already files at `:170`–`:174`:

- `EmptyTrashBinTaskDefinition.ts:68` and `:73` are two identical `isCloseToTimeout()` blocks, and the
  `while (true)` loop at `:90` re-lists rather than paging. The document calls this file "the
  template" — it has rough edges worth knowing about before copying it.
- `DdbListEntries.ts:167` — `const end = limit > totalCount + start + limit ? undefined : start + limit;`
  is a dead branch; the condition cannot be true for non-negative values.

## Notes on the document, not its content

- No `#` heading, date or author, and the filename does not follow the `YYYY-MM-DD-<topic>.md`
  convention used by `2026-07-06-background-tasks-refactor-design.md` in the same folder and by every
  sibling under `docs/.bruno/plans/` and `docs/.bruno/specs/`.
- The measured table (`:55`–`:60`) mixes measured and extrapolated rows; only the following prose says
  which. Marking the extrapolated row would make the strongest evidence self-contained.
- The two tables use different units for the same quantity — records in a model (`:56`) and entries in
  an installation (`:71`) — and share the 10,000 and 100,000 figures with different meanings.

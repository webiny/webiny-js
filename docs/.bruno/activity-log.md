**Status:** proposed, for engineering review
**Feature:** chronological activity log, starting with Headless CMS content entries
**Investigation base:** `release/6.5.0` at `9966e024b9c5ed56e1e26d7d43f5354f8778642f`

## What this document is for

It recommends a storage design and sets out the evidence behind it. Two investigations were run against the codebase before anything was designed, and both changed the answer. Every decision below carries its reasoning so it can be challenged on the merits. If the reasoning is wrong, the decision should change.

The design is scoped to Headless CMS entries for v1, and shaped so that Website Builder pages, templates and versioned files can join it later without a migration. The extensibility section explains which parts of the design that affects.

Open questions are collected at the end.

## The feature, in one paragraph

Each content entry gets a timeline showing every modification made to it, in order, with who made it and which fields changed. Granularity is per save rather than per revision, because a single revision is often worked on for days by several people. Records store field paths and per-field content hashes, never content values. Editors who need values use the existing version compare feature. Records are captured at the entry event layer, are immutable once written, and are retained permanently. The feature is enterprise tier initially, with the intention of extending it to business tier.

## The access pattern

This is the whole of it, and the narrowness is what makes the design straightforward:

- All records for one target, ordered by time, newest first, paginated. This is every timeline view.
- Occasionally filtered by revision or actor within that set.
- Deleted in bulk when a target is permanently purged.

"Target" means a content entry in v1. It is written this way because pages, templates and files want the identical pattern, and the key structure below reflects that.

Nothing queries across targets. Nothing searches record contents. Nothing updates a record after it is written.

## Recommendation

A dedicated DynamoDB table, one item per activity record.

**Key structure.** Partition key on tenant, target type and target id, so every record for one target lives in one partition and two sources can never collide on an id. Target type is `cms-entry` in v1. Sort key on revision, then timestamp, then a uniqueness suffix, descending reads by default, with a defined sentinel for sources that have no version dimension. A timeline page is one query with a limit, and its cost is proportional to the page rather than to the dataset. Putting revision in the sort key is what makes "show me everything on version 5" a key condition rather than a filter, and it costs nothing, as explained in the filtering section below.

**No GSI in v1.** Filtering by actor or action applies to a page that has already been fetched, and no query crosses entries. A GSI on an append-only dataset doubles the write cost, and nothing currently needs one.

**No TTL attribute.** Records are permanent. DynamoDB only expires items carrying the attribute, so omitting it is sufficient, and adding it later for a subset remains possible.

**Native cursor pagination**, using the DynamoDB pagination key rather than a numeric offset. This is worth stating explicitly because the CMS entry list uses an offset, and that behaviour is part of why the private model failed.

**Purge as a background task**, triggered from the entry after-delete event when the delete is permanent. An entry may hold thousands of records, so the inline best-effort cleanup other features use will not hold. `EmptyTrashBinTaskDefinition` is the template, including its timeout checks and continuation.

**Storage behind an abstraction**, with the DynamoDB implementation first. The interface is three operations: append a record, list records for a target with a cursor, delete all records for a target. Details in the SQL section below.

## Why, with the evidence

The obvious choice was a private model. Activity records become content entries, the CMS handles storage on every backend, and standalone works the day it ships with no storage code of our own. Fourteen core features already do this. That was the intended design, and the investigation was scoped to confirm it rather than to compare options.

It failed on measurement.

**The per-entry read cost tracks the size of the whole model.** On the DynamoDB-only backend, listing entries filtered by a field value queries the model partition with no limit, loops until the partition is exhausted, accumulates every record in memory, decompresses and transforms each one, then filters and sorts in JavaScript and slices out a page. The filter never reaches the database.

Measured, for one page of fifty records:

| Records in model | Items read | Bytes read | Read units (derived) |
| --- | --- | --- | --- |
| 3,000 | 3,000 | 6 MB | ~739 |
| 10,000 | 10,000 | 20 MB | ~2,464 |
| 100,000 | 100,000 | 202 MB | ~24,673 |
| 1,000,000 | ~1,000,000 | ~2 GB | ~247,000 |

Items read equals model size exactly at every size tested. The million row is extrapolated; the rest were measured against the dynalite emulator, so absolute latency is not production-representative, while item counts, byte counts and request counts are exact properties of the code path.

Page one, page two and a deep page at 100,000 records were identical to the byte, which is the clearest signal in the data. Costing the same at every offset proves the read is not paginated at the database at all.

Against the deployed configuration, the GraphQL Lambda has 1 GB of memory and a 30 second timeout. At 100,000 records one timeline view pulls 202 MB of JSON into memory and then builds transformed copies of every record, so memory binds before a million is reached. At a million the read is around 2 GB and cannot complete. Throughput is a separate wall: roughly 24,700 read units against a single partition capped at 3,000 per second means about eight seconds of the table's full capacity for one page view, with nothing else running.

**At expected content volumes, the failure arrives early.** Taking 20 revisions per entry at 5 saves each as an average, an entry accumulates around 100 activity records, and the extreme case of 200 revisions at 10 saves reaches 2,000. Because the failing read reads every record in the model regardless of which entry was asked for, the number that matters is that average multiplied by the number of entries:

| Entries in the installation | Activity records | Read per timeline view |
| --- | --- | --- |
| 100 | 10,000 | 20 MB |
| 1,000 | 100,000 | 202 MB |
| 10,000 | 1,000,000 | ~2 GB |

A thousand entries is a small site, and it is already at the point where memory binds. Ten thousand entries cannot complete the read at all.

The dataset makes this worse than the general case. Records are written on every save across every entry and never expire, so the model only grows, and every timeline view in the installation gets slower as it does. A busy installation passes 100,000 quickly, and 100,000 is already past the memory ceiling.

**OpenSearch does not rescue it.** On DDB-ES the query is answered by OpenSearch and the read problem disappears, which would have made the private model acceptable for most customers. Two findings close that off. Indexing cannot be disabled for a single model: the write to OpenSearch is unconditional in the ddb-es storage operations, the per-model index hook returns only settings and a sharing flag with no way to decline, and private models are explicitly included in index creation by default. So every activity record would become a stream table write, a stream event, a Lambda invocation and an OpenSearch document, permanently, for records nobody searches. And if indexing could be disabled, the timeline query is itself a list call, which is the one read path that depends on OpenSearch, so disabling it would remove the feature's own query.

**Writes through the entry layer are fine on latency and wasteful on storage.** One activity record costs one batch write, two DynamoDB items, 4,041 bytes and four write units, adding about 2 ms of in-process work plus one round trip to a save. Latency is not a concern. Size is: those 4 KB store ten small fields and no content values, because the activity payload is a few hundred bytes and the rest is the entry envelope, the twenty-eight meta fields plus keys and index attributes, written twice. An installation doing ten thousand saves a day accumulates roughly 7 GB a year to hold a few hundred megabytes of information.

**A segmented private model was considered and rejected.** Accumulating activities into a segment record with a deterministic id would be read by id rather than by list, and reads by id go straight to DynamoDB on both backends, so the read finding does not apply to it. The write side becomes the problem instead. Every save rewrites the whole accumulated segment through validation and transform, and reindexes it on DDB-ES since indexing cannot be turned off, so the cost lands in the editor's save path rather than in the timeline view. The 400 KB item limit is reached eventually under permanent retention, at which point the timeline stops recording. Concurrent appends from two people saving at once lose one of the two. This solves the read problem by making the write problem worse.

**Sharing the audit logs table was rejected on packaging.** The access pattern matches closely and the table already holds a comparable dataset, but audit logs are deployed only on enterprise instances. Sharing the table would mean deploying audit logs infrastructure to business tier customers who have not bought audit logs, and coupling a business tier feature to an enterprise package.

What remains is a table shaped for the access pattern. Its costs are new infrastructure, an upgrade path, and a storage implementation per backend. The first two are the open questions below. The third is the next section.

## Filtering the timeline

Two filters are expected in the UI: by revision, and by actor. They behave differently under this key structure, and the difference is worth stating because it decides one thing that cannot be changed after the table is created.

**By revision, this is exact.** Revision leads the sort key, so "all activity on version 5" is a key condition and the database returns only matching records. "All activity on the entry" remains one query on the partition, because the sort key is still ordered. The only cost is that the natural ordering becomes revision then time rather than pure time. Revisions are created in increasing order, so those two orderings coincide unless the CMS has a path that produces a revision out of sequence, which is worth confirming.

**By actor, this is a filter after the read.** Actor is an attribute, so DynamoDB applies it after reading and before the limit. The read still costs up to a megabyte per request regardless of how many records survive, and a page of fifty comes back as however many matched within that read, so collecting fifty may take several round trips. On an entry with a few hundred records this is unnoticeable. On one with fifty thousand where the actor touched twelve, it is many requests returning almost nothing.

Combining both filters follows from the above: the revision narrows at the database, and the actor filters after. Since a single revision holds a bounded number of saves, the combination performs well even though one half of it is a filter. The expensive case is actor alone across a long-lived entry.

**The decision that cannot wait.** A local secondary index keyed on actor would make actor filtering exact, and an LSI must be created with the table. It cannot be added later. It also caps the partition at 10 GB, which is a large number of records but is a real ceiling on a dataset with no expiry.

The recommendation is to ship without it, on the grounds that actor filtering is mostly used alongside a revision or on entries small enough for the filter to be free, and that a permanent dataset should not accept a partition ceiling for a secondary convenience. This rests on an assumption about usage rather than on evidence, so it is listed as an open question below.

## Beyond the CMS

The feature ships for content entries. Website Builder pages are the likely second source, templates a probable third once they exist, and file versions a candidate if versioning is added to File Manager. None of that is committed, and none of it is built now. What matters is which parts of the design would need a migration if a second source arrived, because those are worth settling while the table does not yet exist.

**What generalises unchanged.** The access pattern is identical for every source. So is the record shape: timestamp, actor, action, source label, correlation id, and a set of changed paths with hashes describes a change to a page or a file as well as it describes a change to an entry. Purge, pagination and retention need no per-source variation.

**What is settled now because it is irreversible.** The partition key carries a target type, so two sources cannot collide on an id and a record always says what it refers to. The sort key has defined behaviour for targets with no version dimension, which files and possibly templates will need. The GraphQL query takes a target type and a target id rather than an entry id, so adding a source is not a breaking API change. Action values are namespaced per source rather than drawn from one shared enum, since replace file and apply template have no meaning for an entry.

**What cannot be shared, and should not be forced to.** Diffing is per source. The CMS differ walks two entry values against the model AST and matches repeatable items on their stable `_id`. A Website Builder page has no model to walk, since its content is an element tree in a JSON field, so a page differ would match on element ids and produce paths through that tree. A file version differ would compare metadata and produce something different again. The record shape survives all three because every source can express its changes as paths. The mechanism producing them cannot be common code.

Read authorisation is per source for the same reason. Who may see an entry's timeline is a CMS question, and who may see a page's timeline is a Website Builder question, so the read path needs a hook rather than a single rule.

**One rule worth writing down.** Website Builder pages and files are themselves private CMS models storing content in JSON fields, so they already pass through the CMS entry write path. The capture filter excludes private models, which is why audit logs covers Website Builder through its own separate subscriptions. That exclusion is convenient here: each target is owned by exactly one source, and only the owning source records for it. Without that rule, adding page capture later would produce two timelines on the same page, one of them useless, since a CMS differ looking at a page would report that a single JSON field changed.

**What is deliberately not built.** No source registry, no plugin system, no abstraction over differs with a single implementation behind it. One consumer does not justify a registry, and the second consumer is what teaches you the right interface. The CMS differ sits behind a plain interface so a second implementation can join it, and nothing further is added until there is a second.

Whether a page timeline is genuinely useful is a product question rather than a storage one. It depends on whether an element tree diff can say something an editor understands, since "the hero section changed" is useful and "element abc123 changed" is not. Nothing in this design forces that decision either way.

## SQL, and standalone

Standalone deployments use the SQL backend, so a second implementation is needed. The plan is to ship DynamoDB first and follow with SQL, rather than blocking the feature on both.

Packaging follows the audit logs precedent: a feature package holding the event handlers, the diff, the record shape and the storage interface, and one implementation package per backend. The feature package has no DynamoDB dependency.

The interface is three operations:

- Append one record.
- List records for one target entry, newest first, with a cursor and a limit.
- Delete all records for one target entry.

That narrowness is what keeps the second implementation small. On SQL it is one table with columns matching the record shape, a composite index on tenant, target entry id and timestamp descending, and keyset pagination on that index rather than offset pagination. Append is an insert. Purge is a delete by target entry id, which does not need the background task the DynamoDB side requires, though the task should be shared and simply complete faster.

Estimating this at a day or two of work rests on the assumption that the SQL backend offers a usable connection and migration mechanism outside the CMS entry storage layer. That has not been verified and should be checked before the estimate is relied on.

Two consequences worth stating. Standalone gets the feature on a later release than AWS, which needs to be reflected in whatever is communicated externally. And the two implementations must be tested against the same interface test suite, or they will drift in ordering and pagination behaviour, which is exactly where drift is hardest to notice.

## Open questions

These are genuinely open, and the team's guidance is wanted on all of them. The first two are release decisions as much as technical ones, and the third cannot be revisited once the table exists.

**1. How does a new table reach existing installations, and on which tiers?**

The feature is meant to extend to business tier, so the table cannot be conditional on an enterprise package. What is needed: whether a table added to the core infrastructure appears automatically on an existing customer's next deploy, whether anything is required of the customer, and whether conditional deployment is available and desirable. If the deployment cost turns out to be high, that strengthens the case for question 2.

**2. Should activity items go in the existing core table instead of a new one?**

This avoids the deployment and upgrade work entirely, at the cost of putting an unbounded, permanently retained, append-only dataset into a table that upgrade migrations scan. That cost falls on customers at upgrade time, which is the worst moment to discover it. Audit logs chose a separate table for a dataset with the same profile and a shorter life, which is the precedent I would follow. The team should make this choice explicitly rather than inherit it.

**3. Should an LSI on actor be created with the table?**

This is the one decision with no second chance, since an LSI cannot be added to an existing table. The recommendation is no. At an expected 100 records per entry and 2,000 in the extreme case, filtering by actor after the read costs a couple of megabytes at worst, on an entry nobody opens often, which does not justify an index or the 10 GB partition ceiling that comes with it. What would change that is how people are expected to use the filter. If it is mainly a way to narrow a busy timeline while looking at it, filtering after the read is fine. If it is a governance query, where someone asks what a specific person did across an entry's entire history, then the filter is the primary access pattern for that use and deserves an index. Anyone who has heard this asked for by a customer should say so.

**4. Is a GSI needed sooner than v1 assumes?**

The design has none, on the grounds that no query crosses entries. If there is a foreseeable need to answer "what did this user change today" across the installation, that is a different access pattern and better designed in now than bolted on later. Worth saying if anyone has heard that asked for.

**5. Is the per-entry partition hot enough to matter?**

All records for one entry share a partition, which is what makes the read cheap. An entry under heavy concurrent editing, or a bulk operation touching one entry repeatedly, concentrates writes on that key. My reading is that activity write volume per entry stays well inside per-partition limits, since it is bounded by how fast humans and jobs can save. Confirmation from someone who has seen the write patterns at customer scale would be useful.

**6. Does the SQL implementation have the mechanisms this assumes?**

Whether the SQL backend exposes a usable connection and migration path outside the CMS entry storage layer, and whether there is an established pattern for a feature owning its own table there. The estimate above depends on it.

## Related findings to file separately

Two defects surfaced during the investigation. Neither belongs to this feature, and both affect customers today on the DynamoDB-only backend.

Listing entries on that backend has no upper bound on what it loads into memory. Any sufficiently large model takes the GraphQL Lambda down with an out-of-memory kill rather than returning an error or a partial result. This affects every model, and it is the general form of the problem measured above.

The entry list cursor is a numeric offset and is emitted unconditionally, while `hasMoreItems` is computed separately. A client following the cursor without checking that flag pages past the end indefinitely, paying a full model read each time.

# Proposal: activity log read authorisation

**Checkpoint 5 deliverable. A proposal, not an implementation.** Nothing here is built.

Grounded in the machinery that exists on `next`: `createPermissionSchema`, the `cms.contentEntry`
permission, `AccessControl.canAccessEntry()`, and the `advancedAccessControlLayer.hcmsFieldPermissions`
entitlement. Every claim about existing behaviour was read from source.

---

## 1. The two permissions and how they compose

**Two permissions, and one existing check the feature does not own.**

|                             |                                                       |
| --------------------------- | ----------------------------------------------------- |
| `activityLog.timeline`      | May read timelines at all. A capability, not a scope. |
| `activityLog.actor`         | May see who performed each action.                    |
| `canAccessEntry({ model })` | **Already exists.** Decides _which_ timelines.        |

The composition rule: a reader needs `activityLog.timeline` **and** entry read access to the target.
The second is not a new check — `AccessControl.canAccessEntry({ model, entry })` is the same call
`GetRevisionsByEntryIdUseCase` makes to list an entry's revisions, which is the closest existing
analogue to a timeline.

### What a reader without `activityLog.actor` sees

**Confirming your assumption.** The record still appears, with its action, timestamp, revision and
changed paths. The actor renders as a placeholder. The record is not hidden.

The argument for it is stronger than "the timeline is still useful": hiding the record would make
the timeline **lie by omission**. A reader would see an entry with gaps in its history and
reasonably conclude nothing happened in them. An anonymised record says something true — this
changed, then, in these fields, by someone. A missing record says something false.

Two consequences that follow, and one problem that does not have a clean answer:

- **The placeholder must carry no identity at all** — not the actor id, not a hash of it, not a
  stable pseudonym. A stable pseudonym is re-identifiable across a timeline by anyone who can
  correlate one record with a known event.
- **The actor filter is gated by the same permission.** Filtering by actor is itself an
  actor-identity operation: it answers "did this person touch this entry" without ever rendering a
  name. Without `activityLog.actor`, the filter argument is rejected rather than ignored.

- **The problem: for save-type actions, the actor is recoverable anyway, and I cannot design that
  away.** A record carries `revision`. A reader who can see the timeline can, by premise, read the
  entry — and the entry's own `revisionSavedBy` meta field names who saved that revision. So an
  actor-blind reader can join `abc#0004 changed at 10:03` to the entry's meta and recover the name.

  Three options, none of which I can pick for you:

  1. **Accept it, and state the permission's real scope.** `activityLog.actor` then meaningfully
     protects actions that do _not_ appear in entry meta: review transitions, step take-overs,
     trashing, restoring, moves, and anything performed by a task. It does not protect saves. This
     is my recommendation, because it is honest and the protected set is still the interesting one
     — "who approved this" is the question people actually ask.
  2. **Strip `revision` when the actor is hidden.** Closes the join, and breaks the feature:
     revision is how the timeline groups and how the revision filter works.
  3. **Treat it as a reason not to split the permissions at all.** One permission, all or nothing.
     Simpler, and loses the case you described where seeing that an entry changed is fine but
     seeing who changed it is not.

---

## 2. Where the permissions live, and per model or global

**A `permissionsSchema.ts` in `api-activity-log`**, following `api-scheduler` and
`api-website-builder`:

```ts
export const ACTIVITY_LOG_PERMISSIONS_SCHEMA = createPermissionSchema({
  prefix: "activityLog",
  fullAccess: true,
  entities: [
    { id: "timeline", permission: "activityLog.timeline", scopes: ["full"] },
    { id: "actor", permission: "activityLog.actor", scopes: ["full"] }
  ]
});
```

`fullAccess: true` emits `activityLog.*`, so a role with that gets both, and `*` still grants
everything — consistent with every other package.

Named `activityLog.*` rather than `cms.activityLog.*` because the package is deliberately
target-agnostic; a CMS-prefixed permission would have to be renamed the moment Website Builder
targets are recorded.

### Global, not per model — and that is what answers your follow-up

**Both permissions are global capabilities.** Model scoping is already carried by
`canAccessEntry({ model })`, which requires the model and consults `cms.contentModel` and
`cms.contentEntry`.

So **an entry whose model the reader cannot read has no reachable timeline**, and that falls out of
the existing call rather than from new logic. No second model list to diverge from the first. This
matters more than it sounds: a per-model activity permission would be a second place to express
"which models may this person see", and the two would drift.

`scopes: ["full"]` only — no `own`. An own-records scope would mean "you may see the timeline of
entries you created", which is a coherent idea but not one anyone has asked for, and adding it
later requires no data change.

I would **not** make `activityLog.actor` per model in v1. "You may know who edited articles but not
who edited products" is expressible and occasionally sensible, but it doubles the permission surface
for a case nobody has named. Adding it later is a schema change with no migration.

---

## 3. The tier question

**Nothing in this design encodes tier, which is the point.**

Permissions are RBAC; entitlements are licensing. They are separate mechanisms and this proposal
touches only the first. Concretely:

- **The permission names and semantics are identical on every tier.** A business-tier customer with
  the feature enabled grants `activityLog.timeline` exactly as an enterprise one does.
- **Whether the feature registers at all is the entitlement's job**, currently the `enabled`
  parameter on `ActivityLogAppFeature` and later `canUseActivityLog()`. That work is still open and
  blocked on a WCP-issued entitlement — see the pre-pull-request items.
- **So the answer to "how does the permission behave on business tier" is: identically, once the
  entitlement grants the feature.** If the entitlement does not grant it, the feature registers
  nothing, the GraphQL query does not exist, and the permission is inert rather than denying.

**Explicitly not `canUseAuditLogs`**, and not inside the AACL schema either. Putting the timeline
permission under `advancedAccessControlLayer` would tie it to that entitlement and reintroduce
exactly the enterprise-only coupling the brief rules out. The field-path filter (§4) _is_ an AACL
feature — but the filter is an enhancement to the timeline, not a prerequisite for it.

---

## 4. Field paths and the unenforced evaluator

**Store everything, filter nothing, and the filter attaches in exactly one place.**

A decoratable no-op abstraction on the read path:

```ts
export interface IActivityChangesetFilter {
  filter(records: ActivityRecord[], model: CmsModel): Promise<ActivityRecord[]>;
}
```

- **Default implementation returns its input unchanged.** Zero cost, zero behaviour.
- **Attach point: `ListActivityUseCase`**, after storage returns and before the records are
  returned. One `container.registerDecorator` supplies the real filter when AACL implements field
  permissions.
- **Not in storage** — storage is target-agnostic and must not learn what a field is; that would
  put CMS semantics below the interface the whole design keeps clean.
- **Not in the GraphQL resolver** — the resolver stays a thin delegate, and a second consumer would
  bypass it.
- **Not in the UI** — never a client's job.

The path-to-field resolution already exists: `labelForPath` in `core/diff/descriptors.ts` walks a
path against the descriptor tree, and the filter would use the same projection.

**Gated on `advancedAccessControlLayer.hcmsFieldPermissions`**, which already exists and today gates
the field editor's permissions UI. Not a new entitlement.

Two things the filter will have to decide, which I am flagging now rather than discovering later:

- **A rolled-up entry has no single field.** Past the cap, the changeset collapses to a common
  parent. If restricted children sit under that parent, the roll-up neither names them nor can be
  cleanly filtered. Dropping it hides unrestricted siblings; keeping it reveals that _something_
  under a restricted subtree changed.
- **A fully-filtered changeset still reveals a count** unless the record is also hidden — "four
  fields changed, none of which you may see". Consistent with the actor answer (show the record,
  redact the detail), but it is a leak of magnitude and should be a conscious choice.

---

## 5. The delivery API

**Confirming your assumption: manage only.** The design does not push the other way.

- `ApiEndpoint` is `"manage" | "preview" | "read"`. The query registers only when the endpoint is
  `manage`, asserted rather than assumed.
- The read and preview endpoints serve published content to consumers, frequently with a public API
  key. Activity is editorial metadata about _who did what inside the organisation_. Exposing it
  there is a data leak by default, and would be one that no permission grant made deliberately.
- The one argument the other way — a customer building a custom editorial dashboard — is already
  served: the SDK can call the manage API with a token, which is how every other admin-shaped
  operation is reached.

---

## 6. What the changed paths leak on their own

Your example is the right one to test the design against, and the honest answer has two halves.

**Mostly, nothing new.** For a reader who can already read the entry:

- **Model structure is already fully visible.** The manage GraphQL schema is generated from the
  model, so introspection lists every field on every model the reader can reach, and `getModel`
  returns the complete field definitions. "This model has a salary field" is not a disclosure.
- **Which fields changed is already obtainable.** Version compare exists and is the sanctioned way
  to see values between revisions; a reader with entry read access can diff two revisions directly
  and see both the paths and the values. The timeline shows strictly less than that.
- **Field permissions do not currently restrict anything.** The evaluator returns `false`
  unconditionally, so there is no such thing as a field this reader may not see. Until AACL
  implements it, "restricted field" is not a state the system can be in.

**One thing is genuinely new, and it is worth naming.** The timeline aggregates change _frequency
and timing across revisions in a single view_, which no existing surface offers. "Salary changed
three times this week, twice by the same person" is not derivable from the schema, and is tedious
to reconstruct from revision compare. That is a behavioural signal about people, not about content.

Three mitigations, in the order they matter:

1. **`activityLog.timeline` is a separate grant.** Entry read access does not imply timeline
   access, so the aggregation is not handed to everyone who can read content.
2. **The field filter (§4) closes the specific case** once AACL lands, since a restricted field's
   paths would be removed from the changeset.
3. **No values, ever** already means the timeline cannot say _what_ the salary became.

I would not hold the feature for this. But I would not describe the changed-path list as
"information already available" without the frequency caveat, because that would be the kind of
claim that turns out to be wrong in front of a customer.

---

## What I would build, if approved unchanged

In order, as Checkpoint 5 proper:

1. **`src/domain/permissionsSchema.ts`** — the two permissions above.
2. **`ActivityLogPermissions`** via `createPermissionsAbstraction` / `createPermissionsFeature`,
   following `api-scheduler`.
3. **`ListActivityUseCase`** in `src/features/listActivity/`, returning `Result`:
   - resolve the model from the target, and fail `NotFound` if it does not resolve;
   - `canAccessEntry({ model })` → `NotAuthorized` on false;
   - `activityLog.timeline` → `NotAuthorized` on false;
   - reject an `actorId` filter when `activityLog.actor` is absent;
   - call `storage.list(...)`;
   - pass the records through `ActivityChangesetFilter` (no-op by default);
   - redact `actor` to the placeholder when `activityLog.actor` is absent.
4. **`ActivityChangesetFilter`** abstraction plus its pass-through implementation.
5. **The GraphQL query**, manage endpoint only, taking `targetType` and `targetId` — not entry id —
   with `revision`, `actorId`, `limit` and `cursor`. Cursor typed as an opaque `String`.
6. **Tests**: the permission matrix (both permissions, each alone, neither), model-unreadable
   denial, actor redaction leaving the rest of the record intact, the actor filter rejected without
   the permission, the filter abstraction being a no-op, and the query being absent on the read and
   preview endpoints.

**What I would not build**: any field filtering logic, since there is nothing to filter against; a
per-model variant of either permission; or anything on the delivery API.

## Open, and yours to settle

- **The revision-join hole in §1.** Which of the three options, or a fourth. My recommendation is
  the first, with the permission's real scope written down.
- **Roll-up and count leakage in §4.** Both are conscious choices rather than defaults, and neither
  needs settling before the read API is built — but both should be settled before the filter is.

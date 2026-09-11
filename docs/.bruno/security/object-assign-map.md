# Object.assign Audit — API Packages

**Date:** 2026-07-27
**Related to:** [Event Handler Attack Surface](./event-handler-attack-surface.md) (Finding #1 — Prototype Pollution)
**Scope:** All `Object.assign` calls in `packages/api-*` source files (excluding tests)
**Total:** 22 call sites across 18 files

---

## Summary

| Classification | Count | Description |
|---|---|---|
| **SAFE** | 14 | Source is internal-only (model defs, config, constants, internal events) |
| **INDIRECT** | 8 | User data arrives but through validated/constrained path |
| **RISK** | 0 | No direct user-to-Object.assign path found |

No immediate action required, but 3 INDIRECT cases warrant monitoring.

---

## Watch List (INDIRECT — closest to risk)

### transformWhereToNested.ts:55 — GraphQL where clause expansion

```
packages/api-headless-cms/src/graphql/schema/cms/helpers/transformWhereToNested.ts:55
```

Splits dot-notation keys from GraphQL `args.where` into nested objects. Pattern `result[head] = {}` on line 48-49 would invoke the `__proto__` setter if head were `"__proto__"`, changing the local object's prototype (DoS, not global pollution). **Mitigated** by GraphQL input type validation rejecting unknown field names.

> **Fixed in `release/6.5.0`** ([webiny-js@release/6.5.0](https://github.com/webiny/webiny-js/blob/release/6.5.0/packages/api-headless-cms/src/graphql/schema/cms/helpers/transformWhereToNested.ts)): adds `FORBIDDEN_KEYS` set (`__proto__`, `prototype`, `constructor`), throws on forbidden keys, uses `Object.hasOwn` instead of bracket assignment. Needs backport to `next`.

### searchableJsonFilterCreate.ts:9 / searchableJsonFilterCreateHandler.ts:8 — dotFlatten

```
packages/api-headless-cms-storage/src/filtering/plugins/searchableJsonFilterCreate.ts:9
packages/api-headless-cms-storage/src/handlers/searchableJsonFilterCreateHandler.ts:8
```

`Object.assign(acc, dotFlatten(val, path))` processes user-provided where-clause values. **Mitigated** by key prefixing during recursion — bare `__proto__` never appears as a top-level key in the result.

### BaseModel.populate — public method, skippable validation

```
packages/api-core/src/models/base/BaseModel.ts:25
```

`Object.assign(this, data)` in `populate()`. Normal path goes through Zod `safeParse` first (strips unknown keys). But `populate()` is public — a direct call bypasses validation. **Mitigated** by convention, not enforcement.

---

## Full Classification

### SAFE (14 call sites)

| File | Line | Reason |
|---|---|---|
| `api-aco/src/utils/pickEntryFieldValues.ts` | 20 | Keys from hardcoded `baseFields` array |
| `api-audit-logs/src/context/AuditLogsContextValue.ts` | 62 | Internal event subscribers only |
| `api-audit-logs/src/context/AuditLogsContextValue.ts` | 98 | Internal event subscribers only |
| `api-core/src/features/users/shared/loaders.ts` | 85 | Target is fresh `{}`, source from DataLoader cache |
| `api-core/src/models/base/ModelBuilder.ts` | 80 | Developer-defined methods at setup time |
| `api-core/src/models/base/ModelBuilder.ts` | 112 | Developer-defined methods onto prototype |
| `api-core/src/models/cms/PrivateCmsModelBuilder.ts` | 72 | Developer-defined methods at setup time |
| `api-headless-cms-storage/src/filtering/fields/createFields.ts` | 91 | Model schema metadata, not entry data |
| `api-headless-cms-utils-os/src/operations/entry/elasticsearch/fields.ts` | 210 | Field metadata from model config |
| `api-headless-cms/src/constants.ts` | 91 | Keys from hardcoded `ENTRY_META_FIELDS` |
| `api-headless-cms/src/fieldConverters/CmsModelDynamicZoneFieldConverterPlugin.ts` | 180 | Source is storage layer (database) |
| `api-headless-cms/src/graphql/schema/createFieldResolvers.ts` | 82 | Plugin-registered resolver config |
| `api-workflows/src/domain/workflowState/WorkflowState.ts` | 328 | Hardcoded state objects within class |
| `api-workflows/src/domain/workflowState/WorkflowState.ts` | 336 | Hardcoded state transitions within class |

### INDIRECT (8 call sites)

| File | Line | Source | Mitigation |
|---|---|---|---|
| `api-core/src/features/tenancy/UpdateTenant/UpdateTenantUseCase.ts` | 31 | GraphQL mutation input | GraphQL input type constrains shape to known Tenant fields |
| `api-core/src/models/base/BaseModel.ts` | 25 | `populate(data)` — public method | Zod `safeParse` strips unknown keys on normal path; direct calls bypass |
| `api-file-manager-s3/src/utils/FileNormalizer.ts` | 58 | GraphQL file upload mutation | Source of assign is `modifier()` return (plugin), not raw user data |
| `api-file-manager/src/features/upload/utils/FileNormalizer.ts` | 57 | GraphQL file upload mutation | Same — plugin modifier controls returned keys |
| `api-headless-cms-storage/.../searchableJsonFilterCreate.ts` | 9 | GraphQL where clause values | `dotFlatten` prefixes all keys, prevents bare `__proto__` |
| `api-headless-cms-storage/.../searchableJsonFilterCreateHandler.ts` | 8 | GraphQL where clause values | Same key-prefixing mitigation |
| `api-headless-cms/.../CmsModelDynamicZoneFieldConverterPlugin.ts` | 98 | CMS entry values (GraphQL mutation) | Converter produces keys from model schema storage IDs |
| `api-headless-cms/.../transformWhereToNested.ts` | 55 | GraphQL `args.where` | GraphQL input type rejects unknown field names |

---

## Conclusion

All 22 `Object.assign` calls in API packages are either safe or mitigated by upstream validation (primarily GraphQL input type constraints). No direct exploit path exists today.

**However**, these mitigations are defense-in-depth — they rely on GraphQL schema validation preventing `__proto__` from reaching the code. Fixing the root cause (Finding #1 in `apiGatewayEventToHttpRequest.ts`) removes the prototype pollution at the source, making these downstream sites safe regardless of their own validation.

**Recommendation:** Fix Finding #1 first. The Object.assign sites don't need individual changes — they're safe once the input boundary is hardened.

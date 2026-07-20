# OpenSearch AWS Split — Plan Overview

**Spec:** `docs/.bruno/specs/2026-07-17-api-opensearch-aws-split-design.md`
**Branch:** `bruno/feat/api-headless-cms-pg-os`

## Execution Order

Plans are independent where noted. Dependency arrows show required ordering.

```
01-base-client-cleanup
        │
        ▼
02-new-package-scaffold ──► 03-aws-client-wrapper
                                    │
                                    ▼
                            04-aws-factory-feature
                                    │
                                    ▼
                            05-aws-package-exports
        │
        ▼
06-consumer-event-handler  (depends on 05)
07-consumer-template       (depends on 05)
08-consumer-webiny-reexport (depends on 05)
        │
        ▼
09-build-verify            (depends on all above)
```

**Parallelizable:**
- 01 and 02 can run in parallel
- 06, 07, 08 can run in parallel (all depend on 05)

**Sequential:**
- 03 depends on 02
- 04 depends on 03
- 05 depends on 04
- 09 depends on everything

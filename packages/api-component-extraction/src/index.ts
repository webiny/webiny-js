/**
 * `@webiny/api-component-extraction` — extract Webiny components from an existing website.
 *
 * Phase 1 is a vertical tracer bullet through nine gated stages. This barrel exposes the deterministic,
 * reusable surface: the pipeline constants, the domain types, the ledger transforms, and the DI
 * abstractions (models, repositories, run lock). The feature registers everything into a container.
 */

export * from "./constants.js";
export * from "./domain/types.js";
export * from "./domain/errors.js";
export * from "./domain/ledger.js";
export * from "./domain/abstractions.js";
export * from "./feature.js";

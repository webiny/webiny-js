/**
 * Simple content entries — a content entry with the revision and publishing dimensions removed.
 * See `features/simpleContentEntries/DEVELOPERS.md`.
 */

// Designation. A model carries this tag in `model.tags` to become a simple model.
export { SIMPLE_MODEL_TAG } from "~/features/simpleContentEntries/constants.js";

// Types
export type {
    ICmsSimpleEntryContext,
    ICreateSimpleEntryInput,
    IGetSimpleEntryParams,
    IListSimpleEntriesMeta,
    IListSimpleEntriesParams,
    IListSimpleEntriesResult,
    ISimpleCmsEntry,
    ISimpleEntryWhere,
    IUpdateSimpleEntryInput,
    SimpleEntrySort,
    SimpleEntrySortableField
} from "~/features/simpleContentEntries/types.js";

// CreateSimpleEntry
export { CreateSimpleEntryUseCase } from "~/features/simpleContentEntries/createSimpleEntry/abstractions/CreateSimpleEntryUseCase.js";

// UpdateSimpleEntry
export { UpdateSimpleEntryUseCase } from "~/features/simpleContentEntries/updateSimpleEntry/abstractions/UpdateSimpleEntryUseCase.js";

// GetSimpleEntry
export { GetSimpleEntryUseCase } from "~/features/simpleContentEntries/getSimpleEntry/abstractions/GetSimpleEntryUseCase.js";

// ListSimpleEntries
export { ListSimpleEntriesUseCase } from "~/features/simpleContentEntries/listSimpleEntries/abstractions/ListSimpleEntriesUseCase.js";

// DeleteSimpleEntry
export { DeleteSimpleEntryUseCase } from "~/features/simpleContentEntries/deleteSimpleEntry/abstractions/DeleteSimpleEntryUseCase.js";

// SimpleEntryDataFactories
export { CreateSimpleEntryDataFactory } from "~/features/simpleContentEntries/entryDataFactories/createSimpleEntryData/abstractions/CreateSimpleEntryDataFactory.js";
export { UpdateSimpleEntryDataFactory } from "~/features/simpleContentEntries/entryDataFactories/updateSimpleEntryData/abstractions/UpdateSimpleEntryDataFactory.js";

/**
 * The failure contract. Every use case returns a `Result`, so a consumer branching on
 * `result.error` needs these to narrow by `code`.
 */
export {
    ModelIsSimpleError,
    ModelNotSimpleError,
    SimpleEntryNotAuthorizedError,
    SimpleEntryNotFoundError,
    SimpleEntryPersistenceError,
    SimpleEntryValidationError
} from "~/features/simpleContentEntries/domain/errors/index.js";

import { createAbstraction, Result } from "@webiny/feature/api";
import type { CmsEntry, CmsModel } from "~/types/index.js";
import type { EntryPersistenceError } from "~/domain/contentEntry/errors.js";

export interface IUpdateRevisionRepository {
    execute(model: CmsModel, entry: CmsEntry): Promise<Result<void, EntryPersistenceError>>;
}

export const UpdateRevisionRepository = createAbstraction<IUpdateRevisionRepository>(
    "UpdateRevisionRepository"
);

export namespace UpdateRevisionRepository {
    export type Interface = IUpdateRevisionRepository;
}

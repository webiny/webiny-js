import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import {
    FolderNotFoundError,
    FolderPersistenceError
} from "@webiny/api-aco/domain/folder/errors.js";
import { failingFolderReads, testFolders } from "./testFolders.js";

class FakeGetFolderRepository implements GetFolderRepository.Interface {
    public async execute(id: string): Promise<Result<Folder, GetFolderRepository.Error>> {
        if (failingFolderReads.has(id)) {
            return Result.fail(new FolderPersistenceError(new Error("Storage is down.")));
        }
        const folder = testFolders.get(id);
        if (!folder) {
            return Result.fail(new FolderNotFoundError(id));
        }
        return Result.ok(folder);
    }
}

/** Reads folders from `testFolders`, failing the ids in `failingFolderReads`. */
export const registerFakeGetFolderRepository = (container: Container): void => {
    container.registerInstance(GetFolderRepository, new FakeGetFolderRepository());
};

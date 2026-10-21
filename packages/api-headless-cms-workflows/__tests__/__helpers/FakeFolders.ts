import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import {
    GetAncestorsUseCase,
    type GetAncestorsParams
} from "@webiny/api-aco/features/folder/GetAncestors/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import {
    FolderNotFoundError,
    FolderPersistenceError
} from "@webiny/api-aco/domain/folder/errors.js";

/** ACO folders by id. Clear it in `afterEach`. */
export const testFolders = new Map<string, Folder>();

/** Folder ids whose read fails with a persistence error. Clear it in `afterEach`. */
export const failingFolderReads = new Set<string>();

export interface TestFolderParams {
    id: string;
    /** e.g. "cms:author" or "wb:page". */
    type: string;
    /** Defaults to the root. */
    parentId?: string | null;
}

const OWNER = { id: "id-12345678", type: "admin", displayName: "John Doe" };

/** Stores a folder (and its path, like ACO builds it) in `testFolders`. */
export const addTestFolder = (params: TestFolderParams): Folder => {
    const parent = params.parentId ? testFolders.get(params.parentId) : undefined;
    const folder: Folder = {
        id: params.id,
        title: params.id,
        slug: params.id,
        type: params.type,
        parentId: params.parentId ?? null,
        path: `${parent ? parent.path : "root"}/${params.id}`,
        permissions: [],
        createdOn: "2026-10-01T00:00:00.000Z",
        modifiedOn: null,
        savedOn: "2026-10-01T00:00:00.000Z",
        createdBy: OWNER,
        modifiedBy: null,
        savedBy: OWNER
    };
    testFolders.set(folder.id, folder);
    return folder;
};

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

/** `[folder, parent, ...]`, as ACO's `GetAncestorsRepository` returns it. */
class FakeGetAncestors implements GetAncestorsUseCase.Interface {
    public async execute(
        params: GetAncestorsParams
    ): Promise<Result<Folder[], GetAncestorsUseCase.Error>> {
        const chain: Folder[] = [];
        let current: Folder | undefined = params.folder;
        while (current) {
            chain.push(current);
            current = current.parentId ? testFolders.get(current.parentId) : undefined;
        }
        return Result.ok(chain);
    }
}

/**
 * The two ACO folder abstractions the CMS folder port reads (ACO is not part of the harness).
 * Registered by default in `createContextHandler`.
 */
export const registerFakeFolders = (container: Container) => {
    container.registerInstance(GetFolderRepository, new FakeGetFolderRepository());
    container.registerInstance(GetAncestorsUseCase, new FakeGetAncestors());
};

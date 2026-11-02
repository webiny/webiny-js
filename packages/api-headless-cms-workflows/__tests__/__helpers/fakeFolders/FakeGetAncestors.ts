import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import {
    GetAncestorsUseCase,
    type GetAncestorsParams
} from "@webiny/api-aco/features/folder/GetAncestors/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import { testFolders } from "./testFolders.js";

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

/** Walks a folder's parents through `testFolders`. */
export const registerFakeGetAncestors = (container: Container): void => {
    container.registerInstance(GetAncestorsUseCase, new FakeGetAncestors());
};

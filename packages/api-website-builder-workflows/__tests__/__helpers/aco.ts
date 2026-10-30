import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { getStorageOps } from "@webiny/api-core/testing/environment.js";
import { processLegacyPlugins } from "@webiny/api-headless-cms-testing";
import { AcoFeature } from "@webiny/api-aco";
import { CreateFolderUseCase } from "@webiny/api-aco/features/folder/CreateFolder/index.js";
import { GetFolderRepository as GetFolderRepositoryAbstraction } from "@webiny/api-aco/features/folder/GetFolder/abstractions.js";
import { GetFolderRepository } from "@webiny/api-aco/features/folder/GetFolder/GetFolderRepository.js";
import { GetAncestorsUseCase as GetAncestorsUseCaseAbstraction } from "@webiny/api-aco/features/folder/GetAncestors/index.js";
import { GetAncestorsUseCase } from "@webiny/api-aco/features/folder/GetAncestors/GetAncestorsUseCase.js";
import { FolderPersistenceError } from "@webiny/api-aco/domain/folder/errors.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";
import { FakeFolderLevelPermissions } from "./FakeFolderLevelPermissions.js";
import { expectOk } from "./pages.js";
import { FakeGetFlp } from "./FakeGetFlp.js";

/**
 * Real ACO folders for the tests that need them (`legacyPlugins`), as `api-website-builder`'s
 * `pageFolderDelete.test.ts` registers them. Runs after the harness's `registerNoAcoFolders`
 * stand-ins and replaces them. `AcoFeature` registers its own FLP; the fake one goes back on top
 * (A28). The stand-ins are registered as instances, which win over class registrations, so the real
 * folder reads are put back as instances too.
 */
export const registerAco = (container: Container) => {
    processLegacyPlugins(container, getStorageOps("aco").plugins);
    AcoFeature.register(container);
    container.registerInstance(
        GetFolderRepositoryAbstraction,
        container.resolveImplementation(GetFolderRepository)
    );
    container.registerInstance(
        GetAncestorsUseCaseAbstraction,
        container.resolveImplementation(GetAncestorsUseCase)
    );
    container.register(FakeFolderLevelPermissions);
    container.register(FakeGetFlp);
};

class FailingGetFolderRepository implements GetFolderRepositoryAbstraction.Interface {
    public async execute(): Promise<Result<Folder, GetFolderRepositoryAbstraction.Error>> {
        return Result.fail(new FolderPersistenceError(new Error("Storage is down.")));
    }
}

/** Every folder read fails (`legacyPlugins`, after `registerAco`). */
export const failFolderReads = (container: Container) => {
    container.registerInstance(GetFolderRepositoryAbstraction, new FailingGetFolderRepository());
};

export interface WbFolderParams {
    title: string;
    slug: string;
    /** Defaults to the root (`null`). */
    parentId?: string | null;
    /** Defaults to `"wb:page"`. */
    type?: string;
}

/** Creates an ACO folder as the context's identity; needs `registerAco`. */
export const createWbFolder = async (
    context: CmsContext,
    params: WbFolderParams
): Promise<Folder> => {
    return expectOk(
        await context.container.resolve(CreateFolderUseCase).execute({
            title: params.title,
            slug: params.slug,
            type: params.type ?? "wb:page",
            parentId: params.parentId ?? null
        })
    );
};

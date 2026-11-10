import { Result } from "@webiny/feature/api";
import { FolderNotAuthorizedError } from "~/domain/folder/errors.js";
import type {
    CreateFolderParams,
    UpdateFolderParams,
    ListFoldersParams,
    GetFolderHierarchyParams
} from "~/folder/folder.types.js";
import { ListFoldersUseCase } from "../ListFolders/abstractions.js";
import { GetFolderUseCase } from "../GetFolder/abstractions.js";
import { CreateFolderUseCase } from "../CreateFolder/abstractions.js";
import { UpdateFolderUseCase } from "../UpdateFolder/abstractions.js";
import { DeleteFolderUseCase } from "../DeleteFolder/abstractions.js";
import { GetFolderHierarchyUseCase } from "../GetFolderHierarchy/abstractions.js";
import { FolderTypeAccess } from "./abstractions.js";

class ListFoldersWithTypePermissionsImpl implements ListFoldersUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private decoratee: ListFoldersUseCase.Interface
    ) {}

    async execute(params: ListFoldersParams): ListFoldersUseCase.Return {
        // No app access: the app's folders are simply not listed.
        if (!(await this.access.canRead(params.where.type))) {
            return Result.ok({
                folders: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }
        return this.decoratee.execute(params);
    }
}

class GetFolderHierarchyWithTypePermissionsImpl implements GetFolderHierarchyUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private decoratee: GetFolderHierarchyUseCase.Interface
    ) {}

    async execute(params: GetFolderHierarchyParams): GetFolderHierarchyUseCase.Return {
        // No app access: same as listing, the app's folders are not returned.
        if (!(await this.access.canRead(params.type))) {
            return Result.ok({ parents: [], siblings: [] });
        }
        return this.decoratee.execute(params);
    }
}

class GetFolderWithTypePermissionsImpl implements GetFolderUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private decoratee: GetFolderUseCase.Interface
    ) {}

    async execute(id: string) {
        const result = await this.decoratee.execute(id);
        if (result.isFail()) {
            return result;
        }
        if (!(await this.access.canRead(result.value.type))) {
            return Result.fail(new FolderNotAuthorizedError());
        }
        return result;
    }
}

class CreateFolderWithTypePermissionsImpl implements CreateFolderUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private decoratee: CreateFolderUseCase.Interface
    ) {}

    async execute(params: CreateFolderParams) {
        if (!(await this.access.canWrite(params.type))) {
            return Result.fail(new FolderNotAuthorizedError());
        }
        return this.decoratee.execute(params);
    }
}

class UpdateFolderWithTypePermissionsImpl implements UpdateFolderUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private getFolder: GetFolderUseCase.Interface,
        private decoratee: UpdateFolderUseCase.Interface
    ) {}

    async execute(id: string, data: UpdateFolderParams) {
        const folder = await this.getFolder.execute(id);
        if (folder.isFail()) {
            return Result.fail(folder.error);
        }
        if (!(await this.access.canWrite(folder.value.type))) {
            return Result.fail(new FolderNotAuthorizedError());
        }
        return this.decoratee.execute(id, data);
    }
}

class DeleteFolderWithTypePermissionsImpl implements DeleteFolderUseCase.Interface {
    constructor(
        private access: FolderTypeAccess.Interface,
        private getFolder: GetFolderUseCase.Interface,
        private decoratee: DeleteFolderUseCase.Interface
    ) {}

    async execute(id: string) {
        const folder = await this.getFolder.execute(id);
        if (folder.isFail()) {
            return Result.fail(folder.error);
        }
        if (!(await this.access.canWrite(folder.value.type))) {
            return Result.fail(new FolderNotAuthorizedError());
        }
        return this.decoratee.execute(id);
    }
}

export const ListFoldersWithTypePermissions = ListFoldersUseCase.createDecorator({
    decorator: ListFoldersWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess]
});

export const GetFolderHierarchyWithTypePermissions = GetFolderHierarchyUseCase.createDecorator({
    decorator: GetFolderHierarchyWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess]
});

export const GetFolderWithTypePermissions = GetFolderUseCase.createDecorator({
    decorator: GetFolderWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess]
});

export const CreateFolderWithTypePermissions = CreateFolderUseCase.createDecorator({
    decorator: CreateFolderWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess]
});

export const UpdateFolderWithTypePermissions = UpdateFolderUseCase.createDecorator({
    decorator: UpdateFolderWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess, GetFolderUseCase]
});

export const DeleteFolderWithTypePermissions = DeleteFolderUseCase.createDecorator({
    decorator: DeleteFolderWithTypePermissionsImpl,
    dependencies: [FolderTypeAccess, GetFolderUseCase]
});

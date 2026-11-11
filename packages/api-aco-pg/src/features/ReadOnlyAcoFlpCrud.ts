import { WebinyError } from "@webiny/error";
import { AcoFlpCrud } from "@webiny/api-aco/features/folder/shared/abstractions.js";
import { FolderPermissionsRepository } from "@webiny/api-aco/features/flp/FolderPermissionsRepository/abstractions.js";
import type { FolderLevelPermission, ListFlpsParams } from "@webiny/api-aco/flp/flp.types.js";

/**
 * FLP records can be read, but not written: the folder catalog follows the folder entries, so
 * permissions change by changing the folder.
 */
class ReadOnlyAcoFlpCrudImpl implements AcoFlpCrud.Interface {
    public constructor(private readonly repository: FolderPermissionsRepository.Interface) {}

    public get(id: string): Promise<FolderLevelPermission | null> {
        return this.repository.get(id);
    }

    public list({ where }: ListFlpsParams): Promise<FolderLevelPermission[]> {
        return this.repository.list({ where: { type: where.type, parentId: where.parentId } });
    }

    public create(): Promise<FolderLevelPermission> {
        throw this.readOnly();
    }

    public update(): Promise<FolderLevelPermission> {
        throw this.readOnly();
    }

    public delete(): Promise<boolean> {
        throw this.readOnly();
    }

    public batchUpdate(): Promise<FolderLevelPermission[]> {
        throw this.readOnly();
    }

    private readOnly(): WebinyError {
        return new WebinyError(
            "FLP records follow the folder entries on this storage; change the folder instead.",
            "ACO_FLP_READ_ONLY"
        );
    }
}

export const ReadOnlyAcoFlpCrud = AcoFlpCrud.createImplementation({
    implementation: ReadOnlyAcoFlpCrudImpl,
    dependencies: [FolderPermissionsRepository]
});

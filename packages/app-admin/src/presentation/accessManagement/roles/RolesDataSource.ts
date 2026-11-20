import { LocalDataSource } from "~/presentation/listPresenter/LocalDataSource.js";
import type { Role } from "~/features/accessManagement/types.js";
import type { IListRolesUseCase } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class RolesDataSource extends LocalDataSource<Role> {
    constructor(
        private listRolesUseCase: IListRolesUseCase,
        private cache: IListCache<Role>
    ) {
        super();
    }

    protected get items(): Role[] {
        return this.cache.getItems();
    }

    protected async load(): Promise<void> {
        await this.listRolesUseCase.execute();
    }

    protected searchIn(role: Role): Array<string | null | undefined> {
        return [role.name, role.slug, role.description];
    }
}

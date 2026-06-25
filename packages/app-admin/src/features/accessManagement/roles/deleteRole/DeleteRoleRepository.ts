import { RolesListCache } from "../listRoles/abstractions.js";
import {
    DeleteRoleRepository as RepositoryAbstraction,
    DeleteRoleGateway
} from "./abstractions.js";

class DeleteRoleRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteRoleGateway.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        await this.gateway.execute(id);
        this.cache.removeItems(item => item.id === id);
    }
}

export const DeleteRoleRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteRoleRepositoryImpl,
    dependencies: [DeleteRoleGateway, RolesListCache]
});

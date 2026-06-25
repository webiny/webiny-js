import type { Role } from "../../types.js";
import { RolesListCache } from "../listRoles/abstractions.js";
import {
    UpdateRoleRepository as RepositoryAbstraction,
    UpdateRoleGateway,
    type IUpdateRoleData
} from "./abstractions.js";

class UpdateRoleRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateRoleGateway.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async execute(id: string, data: IUpdateRoleData): Promise<Role> {
        const role = await this.gateway.execute(id, data);
        this.cache.updateItems(item => (item.id === role.id ? role : item));
        return role;
    }
}

export const UpdateRoleRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRoleRepositoryImpl,
    dependencies: [UpdateRoleGateway, RolesListCache]
});

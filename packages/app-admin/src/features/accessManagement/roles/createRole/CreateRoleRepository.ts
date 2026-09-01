import type { Role } from "../../types.js";
import { RolesListCache } from "../listRoles/abstractions.js";
import {
    CreateRoleRepository as RepositoryAbstraction,
    CreateRoleGateway,
    type ICreateRoleData
} from "./abstractions.js";

class CreateRoleRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: CreateRoleGateway.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async execute(data: ICreateRoleData): Promise<Role> {
        const role = await this.gateway.execute(data);
        this.cache.addItems([role]);
        return role;
    }
}

export const CreateRoleRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRoleRepositoryImpl,
    dependencies: [CreateRoleGateway, RolesListCache]
});

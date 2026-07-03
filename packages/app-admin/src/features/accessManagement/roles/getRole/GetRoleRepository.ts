import type { Role } from "../../types.js";
import { GetRoleRepository as RepositoryAbstraction, GetRoleGateway } from "./abstractions.js";

class GetRoleRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetRoleGateway.Interface) {}

    async execute(id: string): Promise<Role> {
        return this.gateway.execute(id);
    }
}

export const GetRoleRepository = RepositoryAbstraction.createImplementation({
    implementation: GetRoleRepositoryImpl,
    dependencies: [GetRoleGateway]
});

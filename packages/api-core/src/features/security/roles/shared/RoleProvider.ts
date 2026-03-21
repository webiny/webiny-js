import { RolesProvider } from "~/features/security/shared/abstractions.js";
import { RoleFactory } from "./abstractions.js";
import type { Role } from "./types.js";

class RoleProviderImpl implements RolesProvider.Interface {
    private cache: Role[] | undefined;

    constructor(private roleFactories: RoleFactory.Interface[]) {}

    async getRoles(): Promise<Role[]> {
        if (this.cache === undefined) {
            const results = await Promise.all(this.roleFactories.map(factory => factory.execute()));
            this.cache = results.flat().map<Role>(codeRole => ({
                ...codeRole,
                id: codeRole.slug,
                createdOn: null,
                createdBy: null,
                system: codeRole.system ?? false,
                plugin: true
            }));
        }

        return this.cache;
    }
}

export const RoleProvider = RolesProvider.createImplementation({
    implementation: RoleProviderImpl,
    dependencies: [[RoleFactory, { multiple: true }]]
});

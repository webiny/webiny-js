import type { Container } from "@webiny/di";
import { Authorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import type { Identity } from "~/features/security/IdentityContext/Identity.js";
import type { SecurityPermission } from "~/types/security.js";

export interface Config {
    identityType?: string;
}

class ApiKeyAuthorizerImpl implements IAuthorizer {
    constructor(private identityType: string) {}

    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        if (!identity || identity.type !== this.identityType) {
            return null;
        }
        const permissions = (identity as any).permissions;
        if (!Array.isArray(permissions)) {
            return [];
        }
        return permissions as SecurityPermission[];
    }
}

export default ({ identityType = "api-key" }: Config = {}) =>
    (_container: Container) => {
        _container.registerFactory(Authorizer, () => new ApiKeyAuthorizerImpl(identityType));
    };

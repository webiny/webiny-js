import type { Identity } from "~/domain/Identity.js";
import { AuthenticationRepository as Abstraction } from "./abstractions.js";
import { AuthenticationGateway } from "./abstractions.js";
import { AuthenticationMapper } from "./abstractions.js";

class AuthenticationRepositoryImpl implements Abstraction.Interface {
    constructor(
        private gateway: AuthenticationGateway.Interface,
        private mapper: AuthenticationMapper.Interface
    ) {}

    async login(identityType: string): Promise<Identity> {
        const dto = await this.gateway.execute(identityType);
        return this.mapper.toIdentity(dto);
    }
}

export const AuthenticationRepository = Abstraction.createImplementation({
    implementation: AuthenticationRepositoryImpl,
    dependencies: [AuthenticationGateway, AuthenticationMapper]
});

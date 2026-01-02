import type { Identity } from "~/domain/Identity.js";
import { LogInRepository as Abstraction } from "./abstractions.js";
import { LogInGateway } from "./abstractions.js";
import { IdentityMapper } from "./abstractions.js";

class LogInRepositoryImpl implements Abstraction.Interface {
    constructor(
        private gateway: LogInGateway.Interface,
        private mapper: IdentityMapper.Interface
    ) {}

    async login(identityType: string): Promise<Identity> {
        const dto = await this.gateway.execute(identityType);
        return this.mapper.toIdentity(dto);
    }
}

export const LogInRepository = Abstraction.createImplementation({
    implementation: LogInRepositoryImpl,
    dependencies: [LogInGateway, IdentityMapper]
});

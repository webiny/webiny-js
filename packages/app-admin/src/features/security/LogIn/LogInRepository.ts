import { LogInRepository as Abstraction } from "./abstractions.js";
import { LogInGateway } from "./abstractions.js";
import { IdentityMapper } from "./abstractions.js";

class LogInRepositoryImpl implements Abstraction.Interface {
    constructor(
        private gateway: LogInGateway.Interface,
        private mapper: IdentityMapper.Interface
    ) {}

    async login(): Promise<Abstraction.Result> {
        const result = await this.gateway.execute();
        if (result.step === "selectTenant") {
            return result;
        }

        return { step: "done", identity: this.mapper.toIdentity(result.identity) };
    }
}

export const LogInRepository = Abstraction.createImplementation({
    implementation: LogInRepositoryImpl,
    dependencies: [LogInGateway, IdentityMapper]
});

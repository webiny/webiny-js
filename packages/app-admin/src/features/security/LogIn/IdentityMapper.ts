import { IdentityMapper as Abstraction, LogInRepository } from "./abstractions.js";
import { Identity } from "~/domain/Identity.js";

class IdentityMapperImpl implements Abstraction.Interface {
    toIdentity(dto: LogInRepository.IdentityDTO): Identity {
        return Identity.createAuthenticated(dto);
    }
}

export const IdentityMapper = Abstraction.createImplementation({
    implementation: IdentityMapperImpl,
    dependencies: []
});

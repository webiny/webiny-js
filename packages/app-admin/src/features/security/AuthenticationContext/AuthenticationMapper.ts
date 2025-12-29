import { AuthenticationMapper as Abstraction } from "./abstractions.js";
import type { IdentityDTO } from "./types.js";
import { Identity } from "~/domain/Identity.js";

class AuthenticationMapperImpl implements Abstraction.Interface {
    toIdentity(dto: IdentityDTO): Identity {
        return Identity.createAuthenticated(dto);
    }
}

export const AuthenticationMapper = Abstraction.createImplementation({
    implementation: AuthenticationMapperImpl,
    dependencies: []
});

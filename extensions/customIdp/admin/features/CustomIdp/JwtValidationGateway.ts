import { jwtDecode } from "jwt-decode";
import { JwtValidationGateway as Abstraction } from "./abstractions.js";

const EXPIRATION_BUFFER = 10; // seconds

class JwtValidationGatewayImpl implements Abstraction.Interface {
    decode<T>(token: string): T {
        return jwtDecode<T>(token);
    }

    isExpired(token: string): boolean {
        const decoded = this.decode<{ exp?: number }>(token);
        if (!decoded.exp) {
            return true;
        }
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now + EXPIRATION_BUFFER;
    }
}

export const JwtValidationGateway = Abstraction.createImplementation({
    implementation: JwtValidationGatewayImpl,
    dependencies: []
});

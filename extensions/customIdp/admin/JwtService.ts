import { jwtDecode, type JwtPayload } from "jwt-decode";

const EXPIRATION_BUFFER = 10;

export class JwtService {
    public decode<T extends JwtPayload>(token: string): T {
        return jwtDecode<T>(token);
    }

    public isExpired(token: string): boolean {
        const decoded = this.decode(token);
        if (!decoded.exp) {
            return true;
        }

        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now - EXPIRATION_BUFFER;
    }
}

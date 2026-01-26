import { makeAutoObservable } from "mobx";
import { CustomIdpRepository as Abstraction } from "./abstractions.js";
import { LocalStorage } from "webiny/admin/localStorage";

const ID_TOKEN_KEY = "auth.idToken";
const REFRESH_TOKEN_KEY = "auth.refreshToken";

class CustomIdpRepositoryImpl implements Abstraction.Interface {
    constructor(private localStorage: LocalStorage.Interface) {
        makeAutoObservable(this);
    }

    isAuthenticated(): boolean {
        return !!this.getIdToken();
    }

    getIdToken(): string | undefined {
        return this.localStorage.get<string>(ID_TOKEN_KEY);
    }

    getRefreshToken(): string | undefined {
        return this.localStorage.get<string>(REFRESH_TOKEN_KEY);
    }

    setTokens(tokens: Abstraction.Tokens): void {
        this.localStorage.set(ID_TOKEN_KEY, tokens.idToken);
        this.localStorage.set(REFRESH_TOKEN_KEY, tokens.refreshToken);
    }

    clearTokens(): void {
        this.localStorage.remove(ID_TOKEN_KEY);
        this.localStorage.remove(REFRESH_TOKEN_KEY);
    }
}

export const CustomIdpRepository = Abstraction.createImplementation({
    implementation: CustomIdpRepositoryImpl,
    dependencies: [LocalStorage]
});

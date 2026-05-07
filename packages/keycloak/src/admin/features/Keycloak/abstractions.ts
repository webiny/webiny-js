import { createAbstraction } from "@webiny/feature/admin";
import type Keycloak from "keycloak-js";

export type IOnLogin = (keycloak: Keycloak) => void;

export interface IKeycloakPresenter {
    vm: {
        isAuthenticated: boolean;
        isLoggingIn: boolean;
        checkingSession: boolean;
    };
    init(params: IKeycloakInitParams): Promise<void>;
    authenticate(): void;
}

export interface IKeycloakInitParams {
    /**
     * Full realm URL — e.g., `http://localhost:8180/realms/webiny`. The
     * presenter splits this into `url` + `realm` for keycloak-js, which
     * takes them separately.
     */
    issuer: string;
    clientId: string;
    autoLogin: boolean;
}

export const KeycloakPresenter = createAbstraction<IKeycloakPresenter>("KeycloakPresenter");

export namespace KeycloakPresenter {
    export type Interface = IKeycloakPresenter;
    export type InitParams = IKeycloakInitParams;
    export type OnLogin = IOnLogin;
}

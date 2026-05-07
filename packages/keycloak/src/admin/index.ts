export { Keycloak } from "./Keycloak.js";
export type { KeycloakProps } from "./Keycloak.js";
export { KeycloakLoginScreen } from "./KeycloakLoginScreen.js";
export type { CreateAuthenticationConfig, KeycloakClientOptions } from "./KeycloakLoginScreen.js";
export { Extension } from "./Extension.js";
export { KeycloakFeature, KeycloakPresenter } from "./features/Keycloak/index.js";
export type { IKeycloakPresenter, IKeycloakInitParams } from "./features/Keycloak/index.js";

import { LoginContent, View } from "./components/index.js";

export const Components = {
    LoginContent,
    View
};

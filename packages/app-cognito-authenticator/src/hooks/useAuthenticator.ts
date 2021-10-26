import { useContext } from "react";
import { AuthenticatorContext } from "../Authenticator";

export function useAuthenticator() {
    return useContext(AuthenticatorContext);
}

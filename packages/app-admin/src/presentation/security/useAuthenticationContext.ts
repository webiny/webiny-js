import { useFeature } from "@webiny/app";
import { AuthenticationContextFeature } from "~/features/security/AuthenticationContext/feature.js";

export function useAuthenticationContext() {
    const { authenticationContext } = useFeature(AuthenticationContextFeature);

    return authenticationContext;
}

import { useCallback } from "react";
import Auth from "@aws-amplify/auth";
import get from "lodash.get";
import { useAuthenticator } from "./useAuthenticator";

export interface RequireNewPassword {
    shouldRender: boolean;

    confirm(params: {
        password: string;
        requiredAttributes: { [key: string]: string };
    }): Promise<void>;

    requiredAttributes: string[];
}

export function useRequireNewPassword(): RequireNewPassword {
    const { authState, authData, changeState } = useAuthenticator();

    const checkContact = useCallback(
        user => {
            Auth.verifiedContact(user).then(data => {
                if (data.verified) {
                    changeState("signedIn", user);
                } else {
                    changeState("verifyContact", { ...user, ...data });
                }
            });
        },
        [changeState]
    );

    const confirm = useCallback(
        async ({ password, requiredAttributes }) => {
            try {
                const user = await Auth.completeNewPassword(authData, password, requiredAttributes);
                if (user.challengeName === "SMS_MFA") {
                    changeState("confirmSignIn", user);
                } else if (user.challengeName === "MFA_SETUP") {
                    changeState("TOTPSetup", user);
                } else {
                    checkContact(user);
                }
            } catch (err) {
                console.log(err);
            }
        },
        [changeState]
    );

    return {
        confirm,
        shouldRender: authState === "requireNewPassword",
        requiredAttributes: get(authData, "challengeParam.requiredAttributes", [])
    };
}

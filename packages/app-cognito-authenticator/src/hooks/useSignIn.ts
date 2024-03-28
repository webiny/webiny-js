import { useCallback, useReducer } from "react";
import { Auth } from "@aws-amplify/auth";
import { useAuthenticator } from "./useAuthenticator";
import { AuthData } from "~/Authenticator";

export interface UseSignInCallableParams {
    username: string;
    password: string;
}
export interface UseSignIn {
    shouldRender: boolean;
    signIn(params: UseSignInCallableParams): void;
    loading: boolean;
    error: Error | null;
}

interface State {
    error: Error | null;
    loading: boolean;
}
interface Reducer {
    (prev: State, next: Partial<State>): State;
}

export function useSignIn(): UseSignIn {
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        error: null,
        loading: false
    });
    const { authState, changeState } = useAuthenticator();

    const checkContact = useCallback(
        (user: AuthData) => {
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

    const signIn = useCallback(
        async (input: UseSignInCallableParams) => {
            setState({ loading: true, error: null });
            const { username, password } = input;

            try {
                const user = await Auth.signIn(username.toLowerCase(), password);
                setState({ loading: false });
                if (
                    user.challengeName === "SMS_MFA" ||
                    user.challengeName === "SOFTWARE_TOKEN_MFA"
                ) {
                    changeState("confirmSignIn", user);
                } else if (user.challengeName === "NEW_PASSWORD_REQUIRED") {
                    changeState("requireNewPassword", user);
                } else if (user.challengeName === "MFA_SETUP") {
                    changeState("TOTPSetup", user);
                } else {
                    checkContact(user);
                }
            } catch (err) {
                console.log(err);
                setState({ loading: false });
                if (err.code === "UserNotConfirmedException") {
                    changeState("confirmSignUp", { username });
                } else if (err.code === "PasswordResetRequiredException") {
                    changeState("forgotPassword", { username, system: true });
                } else {
                    setState({ error: err });
                }
            }
        },
        [changeState]
    );

    return {
        shouldRender: ["signIn", "signedOut", "signedUp"].includes(authState),
        signIn,
        ...state
    };
}

import { useCallback, useReducer } from "react";
import Auth from "@aws-amplify/auth";
import { useAuthenticator } from "./useAuthenticator";

export interface SetNewPassword {
    shouldRender: boolean;
    setPassword(params: { code: string; password: string }): Promise<void>;
    error: Error;
    loading: boolean;
}

export function useSetNewPassword(): SetNewPassword {
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        error: null,
        loading: false
    });
    const { authState, authData, changeState } = useAuthenticator();

    const setPassword = useCallback(
        async data => {
            setState({ loading: true });
            const { code, password } = data;

            try {
                await Auth.forgotPasswordSubmit(authData.toLowerCase(), code, password);
                changeState("signIn", null, {
                    title: "Password updated",
                    text: "You can now login using your new password!",
                    type: "success"
                });
                setState({ loading: false, error: null });
            } catch (err) {
                setState({ loading: false, error: err.message });
            }
        },
        [changeState]
    );

    return {
        setPassword,
        shouldRender: authState === "setNewPassword",
        ...state
    };
}

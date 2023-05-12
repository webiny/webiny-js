import { useCallback, useReducer } from "react";
import { Auth } from "@aws-amplify/auth";
import { useAuthenticator } from "./useAuthenticator";

export interface UseSetNewPasswordCallableParams {
    code: string;
    password: string;
}
export interface UseSetNewPassword {
    shouldRender: boolean;
    setPassword(params: UseSetNewPasswordCallableParams): Promise<void>;
    error: string | null;
    loading: boolean;
}

interface State {
    error: string | null;
    loading: boolean;
}
interface Reducer {
    (prev: State, next: Partial<State>): State;
}

interface SetPasswordParams {
    code: string;
    password: string;
}

export function useSetNewPassword(): UseSetNewPassword {
    const [state, setState] = useReducer<Reducer>((prev, next) => ({ ...prev, ...next }), {
        error: null,
        loading: false
    });
    const { authState, authData, changeState } = useAuthenticator();

    const setPassword = useCallback(
        async (data: SetPasswordParams) => {
            /**
             * Stop the callback because we are missing auth data
             */
            if (!authData || !authData.username) {
                return;
            }
            setState({ loading: true });
            const { code, password } = data;
            try {
                await Auth.forgotPasswordSubmit(authData.username.toLowerCase(), code, password);
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

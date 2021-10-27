import { useCallback, useReducer } from "react";
import Auth from "@aws-amplify/auth";
import { useAuthenticator } from "./useAuthenticator";

export interface ForgotPassword {
    shouldRender: boolean;
    requestCode(params: { username: string }): Promise<void>;
    setPassword(params: { username: string }): Promise<void>;
    codeSent: boolean;
    error: Error;
    loading: boolean;
}

export function useForgotPassword(): ForgotPassword {
    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        codeSent: null,
        error: null,
        loading: false
    });

    const { authState, changeState } = useAuthenticator();

    const requestCode = useCallback(async data => {
        setState({ loading: true });
        const { username } = data;
        try {
            const res = await Auth.forgotPassword(username.toLowerCase());
            setState({ loading: false, codeSent: res.CodeDeliveryDetails, error: null });
        } catch (err) {
            if (err.code === "LimitExceededException") {
                setState({
                    loading: false,
                    error: `You can't change password that often. Please try later.`
                });
                return;
            }

            setState({ loading: false, error: err.message });
        }
    }, []);

    const setPassword = useCallback(
        async ({ username }) => {
            setState({ codeSent: null, error: null });
            changeState("setNewPassword", username);
        },
        [changeState]
    );

    return {
        requestCode,
        setPassword,
        shouldRender: authState === "forgotPassword",
        ...state
    };
}

import { useCallback, useReducer } from "react";
import { Auth } from "@aws-amplify/auth";
import { useAuthenticator } from "./useAuthenticator.js";

interface SetPasswordParams {
    username: string;
}

interface RequestCodeParams {
    username: string;
}
export interface ForgotPassword {
    shouldRender: boolean;
    requestCode(params: RequestCodeParams): Promise<void>;
    setPassword(params: SetPasswordParams): Promise<void>;
    codeSent: boolean | null;
    error: string | null;
    loading: boolean;
}

interface State {
    codeSent: boolean | null;
    error: string | null;
    loading: boolean;
}

const defaultState: State = {
    codeSent: null,
    error: null,
    loading: false
};

export function useForgotPassword(): ForgotPassword {
    const [state, setState] = useReducer((prev: State, next: Partial<State>) => {
        return { ...prev, ...next };
    }, defaultState);

    const { authState, changeState } = useAuthenticator();

    const requestCode = useCallback(async (data: RequestCodeParams) => {
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
        async ({ username }: SetPasswordParams) => {
            setState({
                codeSent: null,
                error: null
            });
            changeState("setNewPassword", { username });
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

// @flow
import React, { useReducer, useEffect, useCallback, useMemo } from "react";
import { useApolloClient } from "react-apollo";
import localStorage from "store";
import observe from "store/plugins/observe";
import { getPlugins } from "@webiny/plugins";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { CircularProgress } from "@webiny/ui/Progress";
import { GET_CURRENT_USER, ID_TOKEN_LOGIN } from "../../components/graphql";
import { setIdentity } from "../../identity";

export const SecurityContext = React.createContext();

localStorage.addPlugin(observe);

export const DEFAULT_AUTH_TOKEN = "webiny-token";

type Props = {
    AUTH_TOKEN?: String,
    getUser?: () => Promise<Object>
};

export const SecurityConsumer = ({ children }: Object) => (
    <SecurityContext.Consumer>
        {security => React.cloneElement(children, { security })}
    </SecurityContext.Consumer>
);

export const SecurityProvider = (props: Props) => {
    const auth = getPlugins("security-authentication-provider").pop();

    const AUTH_TOKEN = props.AUTH_TOKEN || DEFAULT_AUTH_TOKEN;
    const client = useApolloClient();

    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        user: null,
        firstLoad: true,
        loading: false,
        checkingUser: false
    });

    const getToken = useCallback(() => {
        return localStorage.get(AUTH_TOKEN);
    });

    const loginUsingIdToken = async (idToken: string) => {
        console.log("idTokenLogin", idToken);
        const res = await client.mutate({
            mutation: ID_TOKEN_LOGIN,
            variables: { idToken }
        });

        if (!res.error) {
            return res.data.login.data;
        }

        return { user: null, token: null };
    };

    const removeToken = useCallback(() => {
        localStorage.remove(AUTH_TOKEN);
    }, []);

    const setToken = useCallback((token: string) => {
        return localStorage.set(AUTH_TOKEN, token);
    }, []);

    const getUser = useHandler(props, ({ getUser }) => async () => {
        setState({ loading: true });

        if (getUser) {
            const user = await getUser();
            setState({ loading: false });
            return user;
        }

        // Get user using default authentication query
        const { data } = await client.query({ query: GET_CURRENT_USER });
        setState({ loading: false });
        return data.security.getCurrentUser.data;
    });

    /**
     * Should be called only by authentication plugin when it obtains
     * an `idToken` from the authentication provider.
     */
    const onIdToken = useHandler(null, () => async idToken => {
        const { token, user } = await loginUsingIdToken(idToken);
        setToken(token);
        setState({ user });
        setIdentity(user);
    });

    // Run authentication plugin hook
    const { getIdToken, renderAuthentication, logout: authLogout } = auth.hook({ onIdToken });

    const logout = useCallback(async () => {
        await authLogout();
        localStorage.remove(AUTH_TOKEN);
    }, []);

    const value = useMemo(() => ({ user: state.user, logout }), [state.user]);

    /**
     * Check if user is logged-in and update state accordingly.
     */
    const checkUser = useHandler(null, () => async () => {
        const idToken = await getIdToken();

        if (!idToken) {
            removeToken();
            setState({ checkingUser: false, user: null });
            return;
        }

        // If AUTH_TOKEN is not present -> login using idToken provided by authentication plugin
        if (!getToken()) {
            const { token, user } = await loginUsingIdToken(idToken);

            if (token) {
                setToken(token);
                setState({ user, checkingUser: false });
            }

            return;
        }

        // Try loading user data using Webiny token
        const user = await getUser();
        if (user) {
            setState({ user, checkingUser: false });
        } else {
            removeToken();
            await checkUser();
        }
    });

    useEffect(() => {
        localStorage.observe(AUTH_TOKEN, async (token: any) => {
            if (!token) {
                setIdentity(null);
                return setState({ user: null });
            }
            const user = await getUser();
            setState({ user, firstLoad: false });
            setIdentity(user);
        });

        checkUser();
    }, []);

    if (state.checkingUser) {
        return <CircularProgress />;
    }

    if (!state.user) {
        return renderAuthentication();
    }

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

import React, {useReducer, useEffect, useCallback, useMemo, ReactElement} from "react";
import { useApolloClient } from "react-apollo";
import localStorage from "store";
import observe from "store/plugins/observe";
import { getPlugins } from "@webiny/plugins";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { SecurityAuthenticationProviderPlugin } from "@webiny/app-security/types";
import { GET_CURRENT_USER, ID_TOKEN_LOGIN } from "../../components/graphql";
import { setIdentity } from "../../identity";

export const SecurityContext = React.createContext(null);

localStorage.addPlugin(observe);

export const DEFAULT_AUTH_TOKEN = "webiny-token";

type Props = {
    loader?: ReactElement;
    allowAnonymous?: Boolean;
    AUTH_TOKEN?: String;
    getUser?: () => Promise<{ [key: string]: any }>;
    onUser?: (user: { [key: string]: any }) => void;
    children?: React.ReactNode;
};

export const SecurityConsumer = ({ children }) => (
    <SecurityContext.Consumer>
        {security => React.cloneElement(children, { security })}
    </SecurityContext.Consumer>
);

export type SecurityContextValue = {
    user: { [key: string]: any };
    logout(): Promise<void>;
    renderAuthentication(params?: { viewProps: {} }): React.ReactElement;
    refreshUser(): Promise<void>;
};

export const SecurityProvider = (props: Props) => {
    const auth = getPlugins(
        "security-authentication-provider"
    ).pop() as SecurityAuthenticationProviderPlugin;

    if (!auth) {
        throw Error(
            `You must register a "security-authentication-provider" plugin to use Security provider!`
        );
    }

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
    }, []);

    const loginUsingIdToken = async (idToken: string) => {
        const res: any = await client.mutate({
            mutation: ID_TOKEN_LOGIN,
            variables: { idToken }
        });

        if (!res.error) {
            return res.data.security.loginUsingIdToken.data;
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
        const { data } = await client.query({ query: GET_CURRENT_USER, fetchPolicy: "no-cache" });
        setState({ loading: false });
        return data.security.getCurrentUser.data;
    });

    /**
     * Should be called only by authentication plugin when it obtains
     * an `idToken` from the authentication provider.
     */
    const onIdToken = useHandler(null, () => async idToken => {
        setState({ checkingUser: true });
        const { token, user } = await loginUsingIdToken(idToken);
        setIdentity(user);
        setToken(token);
        setState({ user, checkingUser: false });
        props.onUser && props.onUser(user);
    });

    // Run authentication plugin hook
    const { getIdToken, renderAuthentication, logout: authLogout } = auth.securityProviderHook({
        onIdToken
    });

    const logout = useCallback(async () => {
        await authLogout();
        localStorage.remove(AUTH_TOKEN);
    }, []);

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
                setIdentity(user);
                setToken(token);
                setState({ user, checkingUser: false });
            }

            return;
        }

        // Try loading user data using Webiny token
        setState({ checkingUser: true });
        const user = await getUser();
        setState({ checkingUser: false });

        if (user) {
            setIdentity(user);
            setState({ user });
            props.onUser && props.onUser(user);
        } else {
            removeToken();
            await checkUser();
        }
    });

    const value: SecurityContextValue = useMemo(
        () => ({
            user: state.user,
            logout,
            renderAuthentication,
            refreshUser: async () => {
                const user = await getUser();
                if (user) {
                    setIdentity(user);
                    setState({ user });
                } else {
                    removeToken();
                    await checkUser();
                }
            }
        }),
        [state.user]
    );

    useEffect(() => {
        localStorage.observe(AUTH_TOKEN, async (token: any) => {
            if (!token) {
                setIdentity(null);
                return setState({ user: null });
            }
            const user = await getUser();
            setIdentity(user);
            setState({ user, firstLoad: false });
        });

        checkUser();
    }, []);

    if (state.checkingUser) {
        return props.loader || null;
    }

    if (!state.user && !props.allowAnonymous) {
        return renderAuthentication();
    }

    return <SecurityContext.Provider value={value}>{props.children}</SecurityContext.Provider>;
};

SecurityProvider.defaultProps = {
    allowAnonymous: false
};

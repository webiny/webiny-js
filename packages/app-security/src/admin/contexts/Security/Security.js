// @flow
import React, { useReducer, useEffect, useCallback, useMemo } from "react";
import { useApolloClient } from "react-apollo";
import localStorage from "store";
import observe from "store/plugins/observe";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { GET_CURRENT_USER } from "../../../components/graphql";
import { setIdentity } from "../../../identity";

export const SecurityContext = React.createContext();

localStorage.addPlugin(observe);

export const DEFAULT_AUTH_TOKEN = "webiny-token";

type Props = {
    AUTH_TOKEN?: String,
    getUser?: () => Promise<Object>,
    setToken?: (token: String) => void
};

export const SecurityConsumer = ({ children }: Object) => (
    <SecurityContext.Consumer>
        {security => React.cloneElement(children, { security })}
    </SecurityContext.Consumer>
);

export const SecurityProvider = (props: Props) => {
    const AUTH_TOKEN = props.AUTH_TOKEN || DEFAULT_AUTH_TOKEN;
    const client = useApolloClient();

    const [state, setState] = useReducer((prev, next) => ({ ...prev, ...next }), {
        user: null,
        firstLoad: true,
        loading: false
    });

    const setToken = useCallback((token: string) => {
        if (props.setToken) {
            return props.setToken(token);
        }

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

    const onToken = useHandler(props, () => async (token: string) => {
        setToken(token);
        const user = await getUser();
        setState({ user });
        setIdentity(user);
    });

    const logout = useCallback(() => {
        return localStorage.remove(AUTH_TOKEN);
    }, []);

    const value = useMemo(() => ({ user: state.user, logout }), [state.user]);

    const renderAuthenticated = useCallback(
        (content: React.Node) => {
            if (!state.user) {
                return null;
            }

            return <SecurityContext.Provider value={value}>{content}</SecurityContext.Provider>;
        },
        [state.user]
    );

    const renderNotAuthenticated = useCallback(
        (content: React.Element<*>) => {
            if (state.user || state.loading) {
                return null;
            }

            return React.cloneElement(content, { onToken });
        },
        [state.user, state.loading]
    );

    const renderInitialLoad = useCallback(
        (content: React.Element<*>) => {
            if (state.firstLoad && state.loading) {
                return content;
            }

            return null;
        },
        [state.firstLoad, state.loading]
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
    }, []);

    return props.children({
        initialLoad: renderInitialLoad,
        authenticated: renderAuthenticated,
        notAuthenticated: renderNotAuthenticated
    });
};

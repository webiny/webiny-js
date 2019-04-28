// @flow
import * as React from "react";
import { compose } from "recompose";
import { withApollo, type WithApolloClient } from "react-apollo";
import localStorage from "store";
import observe from "store/plugins/observe";
import { withSnackbar } from "webiny-admin/components";
import { getCurrentUser, loginUsingToken } from "./graphql";
import { setIdentity } from "webiny-app-security";
const { Provider, Consumer } = React.createContext();

localStorage.addPlugin(observe);

const AUTH_TOKEN = "webiny-token";

type Props = WithApolloClient & {
    getUser?: () => Promise<Object>,
    getToken?: () => String,
    setToken?: (token: String) => void
};

type State = {
    user: ?Object,
    firstLoad: boolean,
    loading: boolean
};

const SecurityProvider = ({ value, children }: Object) => {
    return <Provider value={value}>{children}</Provider>;
};

export const SecurityConsumer = ({ children }: Object) => (
    <Consumer>{security => React.cloneElement(children, { security })}</Consumer>
);

class Security extends React.Component<Props, State> {
    state = {
        user: null,
        firstLoad: true,
        loading: false
    };

    componentDidMount() {
        localStorage.observe(AUTH_TOKEN, async (token: any) => {
            if (!token) {
                this.checkLoginToken();
                setIdentity(null);
                return this.setState({ user: null });
            }
            const user = await this.getUser();

            setIdentity(user);
            this.setState({ user, firstLoad: false });
        });
    }

    checkLoginToken = async () => {
        const query = new URLSearchParams(window.location.search);
        const loginToken = query.get("loginToken");

        if (loginToken && !this.state.user) {
            this.setState({ loading: true });
            const res = await this.props.client.mutate({
                mutation: loginUsingToken,
                variables: { token: loginToken }
            });

            this.setState({ loading: false });

            const { data, error } = res.data.security.loginUsingToken;
            if (error) {
                this.props.showSnackbar(error.message);
                return;
            }

            this.onToken(data.token);
        }
    };

    getToken = () => {
        if (this.props.getToken) {
            return this.props.getToken();
        }

        return localStorage.get(AUTH_TOKEN);
    };

    setToken = (token: string) => {
        if (this.props.setToken) {
            return this.props.setToken(token);
        }

        return localStorage.set(AUTH_TOKEN, token);
    };

    getUser = async () => {
        this.setState({ loading: true });

        if (this.props.getUser) {
            const user = await this.props.getUser();
            this.setState({ loading: false });
            return user;
        }

        // Get user using default authentication query
        const { data } = await this.props.client.query({ query: getCurrentUser });
        this.setState({ loading: false });
        return data.security.getCurrentUser.data;
    };

    onToken = async (token: string) => {
        this.setToken(token);
        const user = await this.getUser();
        this.setState({ user }, () => setIdentity(user));
    };

    logout = () => {
        return localStorage.remove(AUTH_TOKEN);
    };

    renderAuthenticated = (content: React.Node) => {
        if (!this.state.user) {
            return null;
        }

        return (
            <SecurityProvider value={{ user: this.state.user, logout: this.logout }}>
                {content}
            </SecurityProvider>
        );
    };

    renderNotAuthenticated = (content: React.Element<*>) => {
        if (this.state.user || this.state.loading) {
            return null;
        }

        return React.cloneElement(content, { onToken: this.onToken });
    };

    renderInitialLoad = (content: React.Element<*>) => {
        if (this.state.firstLoad && this.state.loading) {
            return content;
        }

        return null;
    };

    render() {
        return this.props.children({
            initialLoad: this.renderInitialLoad,
            authenticated: this.renderAuthenticated,
            notAuthenticated: this.renderNotAuthenticated
        });
    }
}

export default compose(
    withApollo,
    withSnackbar()
)(Security);

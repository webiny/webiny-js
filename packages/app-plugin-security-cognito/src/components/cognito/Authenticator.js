import React from "react";
import Auth from "@aws-amplify/auth";
import { withApollo } from "react-apollo";
import localStorage from "store";
import qs from "query-string";
import observe from "store/plugins/observe";
import debug from "./debug";
localStorage.addPlugin(observe);

class Authenticator extends React.Component {
    constructor() {
        super();

        this.state = {
            authState: "signIn",
            authData: null
        };
    }

    async componentDidMount() {
        const { state, ...params } = qs.parse(window.location.search);

        if (state) {
            await this.onChangeState(state, params);
            return;
        }
        return this.checkUser();
    }

    checkUser = async () => {
        this.setState({ checkingUser: true });
        try {
            const cognitoUser = await Auth.currentSession();
            if (!cognitoUser) {
                await this.onChangeState("signIn");
                this.setState({ checkingUser: false });
            }
        } catch (e) {
            debug("Error %s", e);
            this.setState({ checkingUser: false });
        }
    };

    onChangeState = async (state, data) => {
        debug("Requested state change %s %O", state, data);
        if (state === this.state.authState) {
            return;
        }

        // Cognito states call this state with user data.
        if (state === "signedIn" && data) {
            const user = await Auth.currentSession();
            return this.props.onIdToken(user.idToken.jwtToken);
        }

        if (state === "signedOut") {
            state = "signIn";
        }

        this.setState({ authState: state, authData: data, error: null });
    };

    render() {
        const { user, authState, authData, checkingUser } = this.state;

        return this.props.children({
            user,
            authState,
            authData,
            changeState: this.onChangeState,
            checkingUser
        });
    }
}

export default withApollo(Authenticator);

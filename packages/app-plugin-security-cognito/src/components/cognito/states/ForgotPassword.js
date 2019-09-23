import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "./../debug";

class ForgotPassword extends React.Component {
    authStates = ["forgotPassword"];

    state = {
        linkSent: null,
        error: null,
        loading: false
    };

    requestLink = async data => {
        this.setState({ loading: true });
        const { username } = data;
        try {
            const res = await Auth.forgotPassword(username.toLowerCase());
            debug("Forgot password %O", res);
            this.setState({ loading: false, linkSent: res.CodeDeliveryDetails });
        } catch (err) {
            if (err.code === "LimitExceededException") {
                this.setState({
                    loading: false,
                    error: `You can't change password that often. Please try later.`
                });
                return;
            }

            this.setState({ loading: false, error: err.message });
        }
    };

    setPassword = async data => {
        this.setState({ loading: true });
        const { username, code, password } = data;

        try {
            const res = await Auth.forgotPasswordSubmit(username.toLowerCase(), code, password);
            debug("forgot-password:setPassword %O", res);
            this.props.changeState("signIn");
            this.setState({ loading: false, linkSent: null, username: null, code: null });
        } catch (err) {
            this.setState({ loading: false, error: err.message });
        }
    };

    render() {
        const { authState, children } = this.props;
        if (!this.authStates.includes(authState)) {
            return null;
        }

        return children({
            requestLink: this.requestLink,
            setPassword: this.setPassword,
            linkSent: this.state.linkSent,
            error: this.state.error,
            loading: this.state.loading
        });
    }
}

export default ForgotPassword;

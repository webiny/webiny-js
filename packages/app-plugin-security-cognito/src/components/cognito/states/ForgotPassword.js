import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "./../debug";

class ForgotPassword extends React.Component {
    authStates = ["forgotPassword"];

    state = {
        codeSent: null,
        error: null,
        loading: false
    };

    requestCode = async data => {
        this.setState({ loading: true });
        const { username } = data;
        try {
            const res = await Auth.forgotPassword(username.toLowerCase());
            debug("Forgot password %O", res);
            this.setState({ loading: false, codeSent: res.CodeDeliveryDetails, error: null });
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

    setPassword = async ({ username }) => {
        this.setState({ codeSent: null, error: null });
        this.props.changeState("setNewPassword", username);
    };

    render() {
        const { authState, children } = this.props;
        if (!this.authStates.includes(authState)) {
            return null;
        }

        return children({
            requestCode: this.requestCode,
            setPassword: this.setPassword,
            codeSent: this.state.codeSent,
            error: this.state.error,
            loading: this.state.loading
        });
    }
}

export default ForgotPassword;

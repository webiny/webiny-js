import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "./../debug";

class SetNewPassword extends React.Component {
    authStates = ["setNewPassword"];

    state = {
        error: null,
        loading: false
    };

    setPassword = async data => {
        this.setState({ loading: true });
        const { code, password } = data;
        const { authData } = this.props;

        try {
            const res = await Auth.forgotPasswordSubmit(authData.toLowerCase(), code, password);
            debug("set-new-password:setPassword %O", res);
            this.props.changeState("signIn", null, {
                title: "Password updated",
                text: "You can now login using your new password!",
                type: "success"
            });
            this.setState({ loading: false, error: null });
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
            setPassword: this.setPassword,
            error: this.state.error,
            loading: this.state.loading
        });
    }
}

export default SetNewPassword;

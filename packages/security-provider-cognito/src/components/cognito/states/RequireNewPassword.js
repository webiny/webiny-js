import React from "react";
import Auth from "@aws-amplify/auth";
import debug from "../debug";

class RequireNewPassword extends React.Component {
    // States when this view should be visible
    authStates = ["requireNewPassword"];

    checkContact = user => {
        const { changeState } = this.props;
        Auth.verifiedContact(user).then(data => {
            if (data.verified) {
                changeState("signedIn", user);
            } else {
                changeState("verifyContact", { ...user, ...data });
            }
        });
    };

    confirm = async ({ password }) => {
        const { changeState, authData } = this.props;
        const { requiredAttributes = {} } = authData.challengeParam || {};

        // TODO: requiredAttributes

        try {
            const user = await Auth.completeNewPassword(authData, password, {
                family_name: "Denisjuk",
                given_name: "Pavel"
            });
            debug("complete new password", user);
            if (user.challengeName === "SMS_MFA") {
                changeState("confirmSignIn", user);
            } else if (user.challengeName === "MFA_SETUP") {
                debug("TOTP setup", user.challengeParam);
                changeState("TOTPSetup", user);
            } else {
                this.checkContact(user);
            }
        } catch (err) {
            debug(err);
        }
    };

    render() {
        const { authState, children, changeState } = this.props;
        if (!this.authStates.includes(authState)) {
            return null;
        }

        return children({ confirm: this.confirm, changeState });
    }
}

export default RequireNewPassword;

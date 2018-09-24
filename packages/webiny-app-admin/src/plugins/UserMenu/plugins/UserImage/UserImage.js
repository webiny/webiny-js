// @flow
import React from "react";
import { app } from "webiny-app";
import { Avatar } from "webiny-ui/Avatar";

class UserAvatar extends React.Component<{}> {
    componentDidMount() {
        app.security.onIdentity(() => {
            this.forceUpdate();
        });
    }

    render() {
        const {
            security: { identity }
        } = app;

        // When user logs out, identity becomes null.
        if (!identity) {
            return null;
        }

        const { fullName, avatar } = identity;

        return <Avatar src={avatar && avatar.src} alt={fullName} fallbackText={fullName} />;
    }
}
export default UserAvatar;

// @flow
import React from "react";
import { Avatar } from "webiny-ui/Avatar";
import { withSecurity } from "webiny-app/components";
import type { Security } from "webiny-app/types";

class UserAvatar extends React.Component<{ security: Security }> {
    componentDidMount() {
        this.props.security.onIdentity(() => {
            this.forceUpdate();
        });
    }

    render() {
        const { security } = this.props;
        if (!security) {
            return null;
        }

        // When user logs out, identity becomes null.
        if (!security.identity) {
            return null;
        }

        const { fullName, avatar } = security.identity;

        return <Avatar src={avatar && avatar.src} alt={fullName} fallbackText={fullName} />;
    }
}
export default withSecurity()(UserAvatar);

// @flow
import React from "react";
import { Avatar } from "webiny-ui/Avatar";
import { withSecurity, type WithSecurityProps } from "webiny-security/components";

class UserAvatar extends React.Component<WithSecurityProps> {
    render() {
        const { security } = this.props;
        if (!security || !security.user) {
            return null;
        }

        const { fullName, avatar } = security.user;

        return <Avatar src={avatar && avatar.src} alt={fullName} fallbackText={fullName} />;
    }
}
export default withSecurity()(UserAvatar);

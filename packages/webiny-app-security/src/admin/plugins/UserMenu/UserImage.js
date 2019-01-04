// @flow
import React from "react";
import { Avatar } from "webiny-ui/Avatar";
import { withSecurity, type WithSecurityPropsType } from "webiny-app-security/components";

class UserAvatar extends React.Component<WithSecurityPropsType> {
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

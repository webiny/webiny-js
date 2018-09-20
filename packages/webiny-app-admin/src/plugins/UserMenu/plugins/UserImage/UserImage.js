// @flow
import React from "react";
import { css } from "emotion";
import { app } from "webiny-app";
import classNames from "classnames";

const avatarMenu = css({
    borderRadius: "50%",
    display: "block",
    width: 35,
    height: 35,
    "&.blank": {
        backgroundColor: "lightgray"
    }
});

class UserAvatar extends React.Component<{}> {
    componentDidMount() {
        app.security.onIdentity(() => {
            this.forceUpdate();
        });
    }

    render() {
        const {
            security: {
                identity: { fullName, avatar }
            }
        } = app;

        if (avatar) {
            return <img src={avatar.src} alt={fullName} className={avatarMenu} />;
        }

        return <div className={classNames(avatarMenu, "blank")} />;
    }
}
export default UserAvatar;

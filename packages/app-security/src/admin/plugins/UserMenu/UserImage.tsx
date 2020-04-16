import React from "react";
import { Link } from "@webiny/react-router";
import { Avatar } from "@webiny/ui/Avatar";
import { Image } from "@webiny/app/components";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

const UserImage = () => {
    const security = useSecurity();

    if (!security || !security.user) {
        return null;
    }

    const { fullName, avatar } = security.user;

    return (
        <Link to={"/account"} style={{ textDecoration: "none" }}>
            <Avatar
                data-testid="logged-in-user-menu-avatar"
                src={avatar && avatar.src}
                alt={fullName}
                fallbackText={fullName}
                renderImage={props => <Image {...props} transform={{ width: 100 }} />}
            />
        </Link>
    );
};

export default UserImage;

//@flow
import React from "react";
import { ReactComponent as SignOutIcon } from "webiny-security/admin/assets/icons/round-lock_open-24px.svg";
import { ListItem, ListItemGraphic } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";
import { withSecurity } from "webiny-security/components";

const SignOut = (props: Object) => {
    return (
        <ListItem onClick={() => props.security.logout()}>
            <ListItemGraphic>{<Icon icon={<SignOutIcon />} />}</ListItemGraphic>
            Sign out
        </ListItem>
    );
};

export default withSecurity()(SignOut);

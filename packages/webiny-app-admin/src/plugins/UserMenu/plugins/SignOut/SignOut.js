//@flow
import React from "react";
import { ReactComponent as SignOutIcon } from "webiny-app-admin/assets/icons/round-lock_open-24px.svg";
import { ListItem, ListItemGraphic } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";

const SignOut = (props) => {
    return (
        <ListItem onClick={props.logout}>
            <ListItemGraphic>
                <Icon icon={<SignOutIcon />} />
            </ListItemGraphic>
            Sign out
        </ListItem>
    );
};

export default SignOut;
// TODO: withSecurity

/*export default connect(
    null,
    { /!*logout*!/ }
)(SignOut);*/

//@flow
import React from "react";
import { connect } from "react-redux";
import { logout } from "webiny-app/actions";
import { ReactComponent as SignOutIcon } from "webiny-app-admin/assets/icons/round-lock_open-24px.svg";
import { ListItem, ListItemGraphic } from "webiny-ui/List";
import { Icon } from "webiny-ui/Icon";

const SignOut = ({ logout }) => {
    return (
        <ListItem onClick={logout}>
            <ListItemGraphic>
                <Icon icon={<SignOutIcon />} />
            </ListItemGraphic>
            Sign out
        </ListItem>
    );
};

export default connect(
    null,
    { logout }
)(SignOut);

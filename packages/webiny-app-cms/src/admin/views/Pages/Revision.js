// @flow
import React from "react";
import { compose } from "recompose";
import { graphql } from "react-apollo";
import {
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemMeta
} from "webiny-ui/List";
import { IconButton } from "webiny-ui/Button";
import { MenuItem, Menu, MenuDivider } from "webiny-ui/Menu";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/admin/assets/more_vert.svg";

type RevisionProps = {
    rev: Object
};

const Revision = ({rev}: RevisionProps) => {
    return (
        <ListItem style={{ overflow: "visible" }}>
            <ListItemText>
                <ListItemTextPrimary>{rev.title}</ListItemTextPrimary>
                <ListItemTextSecondary>
                    Last modified on {rev.savedOn} ({rev.name})
                </ListItemTextSecondary>
            </ListItemText>
            <ListItemMeta>
                <Menu handle={<IconButton icon={<MoreVerticalIcon />} />}>
                    <MenuItem onClick={() => {}}>Create new</MenuItem>
                    <MenuItem onClick={() => {}}>Edit</MenuItem>
                    <MenuItem onClick={() => {}}>Publish</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={() => {}}>Delete</MenuItem>
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default compose(

)(Revision);
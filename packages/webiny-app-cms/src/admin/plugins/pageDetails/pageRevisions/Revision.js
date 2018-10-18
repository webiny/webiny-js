// @flow
import React from "react";
import { compose, withHandlers, withProps } from "recompose";
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
import { withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/admin/assets/more_vert.svg";
import { createRevisionFrom, deleteRevision } from "./graphql";

type RevisionProps = {
    page: Object,
    rev: Object,
    createRevision: Function,
    editRevision: Function
};

const Revision = ({ page, rev, createRevision, editRevision }: RevisionProps) => {
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
                    <MenuItem onClick={createRevision}>Create new</MenuItem>
                    <MenuItem onClick={editRevision}>Edit</MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={() => {}}>Publish</MenuItem>
                    {!rev.locked && <MenuItem onClick={() => {}}>Delete</MenuItem>}
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default compose(
    withRouter(),
    withSnackbar(),
    graphql(createRevisionFrom, { name: "createRevisionFrom" }),
    graphql(deleteRevision, { name: "deleteRevision" }),
    withHandlers({
        createRevision: ({ rev, router, pageId, createRevisionFrom, showSnackbar }: Object) => async () => {
            const { data: res } = await createRevisionFrom({ variables: { revisionId: rev.id } });
            const { data, error } = res.cms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            router.goToRoute({
                name: "Cms.Editor",
                params: { page: pageId, revision: data.id }
            });
        },
        editRevision: ({ rev, router, pageId }) => () => {
            router.goToRoute({ name: "Cms.Editor", params: { page: pageId, revision: rev.id } });
        },
        deleteRevision: ({ rev, deleteRevision, showSnackbar }) => async () => {
            const { data: res } = await deleteRevision({ variables: { id: rev.id } });
            const { data, error } = res.cms.deleteRevision;
            if (error) {
                return showSnackbar(error.message);
            }
        }
    })
)(Revision);

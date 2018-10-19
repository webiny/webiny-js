// @flow
import React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
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
                <Menu handle={<IconButton icon={<MoreVerticalIcon />}/>}>
                    <MenuItem onClick={createRevision}>Create new</MenuItem>
                    <MenuItem onClick={editRevision}>Edit</MenuItem>
                    <MenuDivider/>
                    <MenuItem onClick={() => {}}>Publish</MenuItem>
                    {!rev.locked && <MenuItem onClick={() => {}}>Delete</MenuItem>}
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

const createRevisionMutation = gql`
    mutation CreateRevisionFrom($revisionId: ID!) {
        cms {
            revision: createRevisionFrom(revisionId: $revisionId) {
                data {
                    id
                    page {
                        id
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export default compose(
    withRouter(),
    withSnackbar(),
    graphql(createRevisionMutation, { name: "createRevisionFrom" }),
    withHandlers({
        createRevision: ({ rev, router, createRevisionFrom, showSnackbar }: Object) => async () => {
            const { data: res } = await createRevisionFrom({ variables: { revisionId: rev.id } });
            const { data, error } = res.cms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            router.goToRoute({
                name: "Cms.Editor",
                params: { page: data.page.id, revision: data.id }
            });
        },
        editRevision: ({ page, rev, router }) => () => {
            router.goToRoute({ name: "Cms.Editor", params: { page: page.id, revision: rev.id } });
        }
    })
)(Revision);

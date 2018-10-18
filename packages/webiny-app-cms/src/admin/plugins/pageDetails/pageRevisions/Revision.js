// @flow
import React from "react";
import { compose, withHandlers, withProps } from "recompose";
import gql from "graphql-tag";
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
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { withPageDetails, type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/admin/assets/more_vert.svg";
import {
    createRevisionFrom,
    publishRevision,
    deleteRevision,
    activeRevisionFragment
} from "./graphql";

type RevisionProps = WithPageDetailsProps & {
    rev: Object,
    createRevision: Function,
    editRevision: Function,
    deleteRevision: Function,
    publishRevision: Function
};

const Revision = ({
    rev,
    pageDetails: { revision },
    createRevision,
    editRevision,
    deleteRevision,
    publishRevision
}: RevisionProps) => {
    return (
        <ConfirmationDialog
            title="Confirmation required!"
            message={
                <span>
                    Are you sure you want to delete <strong>{rev.name}</strong>?
                </span>
            }
        >
            {({ showConfirmation }) => (
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
                            <MenuItem onClick={publishRevision}>Publish</MenuItem>
                            {!rev.locked &&
                                revision.data.id !== rev.id && (
                                    <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                        Delete
                                    </MenuItem>
                                )}
                        </Menu>
                    </ListItemMeta>
                </ListItem>
            )}
        </ConfirmationDialog>
    );
};

export default compose(
    withRouter(),
    withSnackbar(),
    withPageDetails(),
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    graphql(publishRevision, { name: "gqlPublish" }),
    graphql(deleteRevision, { name: "gqlDelete" }),
    withProps(({ pageDetails }) => ({
        pageId: pageDetails.pageId
    })),
    withHandlers({
        createRevision: ({ rev, router, pageId, gqlCreate, showSnackbar }: Object) => async () => {
            const { data: res } = await gqlCreate({ variables: { revisionId: rev.id } });
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
        publishRevision: ({ rev, pageId, gqlPublish, showSnackbar }) => async () => {
            const { data: res } = await gqlPublish({
                //refetchQueries: ["CmsListPages"],
                variables: { id: rev.id },
                update: (cache, res) => {
                    cache.writeFragment({
                        id: pageId,
                        fragment: activeRevisionFragment,
                        data: {
                            __typename: "Page",
                            activeRevision: {
                                ...res.data.cms.publishRevision.data
                            }
                        }
                    });
                }
            });

            const { error } = res.cms.publishRevision;
            if (error) {
                return showSnackbar(error.message);
            }

            showSnackbar(
                <span>
                    Successfully published <strong>{rev.name}</strong>
                </span>
            );
        },
        deleteRevision: ({ rev, gqlDelete, showSnackbar }) => async () => {
            const { data: res } = await gqlDelete({
                refetchQueries: ["CmsLoadPageRevisions"],
                variables: { id: rev.id }
            });
            const { error } = res.cms.deleteRevision;
            if (error) {
                return showSnackbar(error.message);
            }
        }
    })
)(Revision);

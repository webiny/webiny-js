// @flow
import React from "react";
import { compose, withHandlers, withProps, withState } from "recompose";
import { graphql } from "react-apollo";
import {
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemGraphic,
    ListItemMeta
} from "webiny-ui/List";
import { IconButton } from "webiny-ui/Button";
import { Icon } from "webiny-ui/Icon";
import { MenuItem, Menu, MenuDivider } from "webiny-ui/Menu";
import { withRouter } from "webiny-app/components";
import { withSnackbar } from "webiny-app-admin/components";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { Tooltip } from "webiny-ui/Tooltip";
import { withPageDetails, type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { ReactComponent as MoreVerticalIcon } from "webiny-app-cms/admin/assets/more_vert.svg";
import { ReactComponent as LockIcon } from "webiny-app-cms/admin/assets/lock.svg";
import { ReactComponent as BeenHereIcon } from "webiny-app-cms/admin/assets/beenhere.svg";
import { ReactComponent as GestureIcon } from "webiny-app-cms/admin/assets/gesture.svg";
import CreateRevisionDialog from "./CreateRevisionDialog";
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
    publishRevision: Function,
    createRevisionDialog: boolean,
    setCreateRevisionDialog: Function,
    submitCreateRevision: Function
};

const getIcon = (rev: Object) => {
    switch (true) {
        case rev.locked && !rev.published:
            return { icon: LockIcon, text: "This revision is locked (it has already been published)" };
        case rev.published:
            return { icon: BeenHereIcon, text: "This revision is currently published!" };
        default:
            return { icon: GestureIcon, text: "This is a draft" };
    }
};

const Revision = ({
    rev,
    pageDetails: { revision, revisions },
    createRevision,
    editRevision,
    deleteRevision,
    publishRevision,
    createRevisionDialog,
    setCreateRevisionDialog
}: RevisionProps) => {
    const { icon: RevIcon, text: tooltipText } = getIcon(rev);

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
                    <ListItemGraphic>
                        <Tooltip content={tooltipText} placement={"bottom"}>
                            <Icon icon={<RevIcon />} />
                        </Tooltip>
                    </ListItemGraphic>
                    <ListItemText>
                        <ListItemTextPrimary>{rev.title}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            Last modified on {rev.savedOn} ({rev.name})
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <CreateRevisionDialog
                            open={createRevisionDialog}
                            onClose={() => setCreateRevisionDialog(false)}
                            onSubmit={createRevision}
                            revisions={revisions.data}
                        />
                        <Menu handle={<IconButton icon={<MoreVerticalIcon />} />}>
                            <MenuItem onClick={() => setCreateRevisionDialog(true)}>
                                Create new
                            </MenuItem>
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
    withState("createRevisionDialog", "setCreateRevisionDialog", false),
    withHandlers({
        createRevision: ({ rev, router, pageId, gqlCreate, showSnackbar }: Object) => async (
            formData: Object
        ) => {
            const { data: res } = await gqlCreate({
                variables: { revisionId: rev.id, name: formData.name }
            });
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

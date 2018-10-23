// @flow
import React from "react";
import { compose, withProps, withState, withHandlers } from "recompose";
import { css } from "emotion";
import TimeAgo from "timeago-react";
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
import withRevisionHandlers from "./withRevisionHandlers";

type RevisionProps = WithPageDetailsProps & {
    rev: Object,
    createRevision: Function,
    editRevision: Function,
    deleteRevision: Function,
    publishRevision: Function,
    openDialog: boolean,
    setCreateRevisionDialog: Function,
    submitCreateRevision: Function
};

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const getIcon = (rev: Object) => {
    switch (true) {
        case rev.locked && !rev.published:
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case rev.published:
            return {
                icon: <Icon icon={<BeenHereIcon />} className={primaryColor} />,
                text: "This revision is currently published!"
            };
        default:
            return {
                icon: <Icon icon={<GestureIcon />} />,
                text: "This is a draft"
            };
    }
};

const Revision = ({
    rev,
    pageDetails: { revision, revisions },
    createRevision,
    editRevision,
    deleteRevision,
    publishRevision,
    openDialog,
    showDialog,
    hideDialog
}: RevisionProps) => {
    const { icon, text: tooltipText } = getIcon(rev);

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
                            {icon}
                        </Tooltip>
                    </ListItemGraphic>
                    <ListItemText>
                        <ListItemTextPrimary>{rev.title}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            Last modified <TimeAgo datetime={rev.savedOn} /> ({rev.name}) v{rev.version}
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <CreateRevisionDialog
                            open={openDialog}
                            onClose={hideDialog}
                            onSubmit={createRevision}
                            revisions={revisions.data}
                        />
                        <Menu handle={<IconButton icon={<MoreVerticalIcon />} />}>
                            <MenuItem onClick={showDialog}>New</MenuItem>
                            <MenuItem onClick={editRevision}>Edit</MenuItem>
                            {!rev.published && (
                                <MenuItem onClick={() => publishRevision(rev)}>Publish</MenuItem>
                            )}
                            {!rev.locked &&
                                revision.data.id !== rev.id && (
                                    <React.Fragment>
                                        <MenuDivider />
                                        <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                            Delete
                                        </MenuItem>
                                    </React.Fragment>
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
    withProps(({ pageDetails }) => ({
        pageId: pageDetails.pageId
    })),
    withState("openDialog", "setOpenDialog", false),
    withHandlers({
        showDialog: ({ setOpenDialog }) => () => setOpenDialog(true),
        hideDialog: ({ setOpenDialog }) => () => setOpenDialog(false)
    }),
    withRevisionHandlers
)(Revision);

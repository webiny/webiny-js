// @flow
import React from "react";
import { css } from "emotion";
import TimeAgo from "timeago-react";
import {
    ListItem,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary,
    ListItemGraphic,
    ListItemMeta
} from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Icon } from "@webiny/ui/Icon";
import { MenuItem, Menu, MenuDivider } from "@webiny/ui/Menu";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as AddIcon } from "@webiny/app-forms/admin/icons/add.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/app-forms/admin/icons/beenhere.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-forms/admin/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/app-forms/admin/icons/edit.svg";
import { ReactComponent as GestureIcon } from "@webiny/app-forms/admin/icons/gesture.svg";
import { ReactComponent as LockIcon } from "@webiny/app-forms/admin/icons/lock.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-forms/admin/icons/more_vert.svg";
import { ReactComponent as PublishIcon } from "@webiny/app-forms/admin/icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/app-forms/admin/icons/unpublish.svg";
import { useRevision } from "./useRevision";

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: Object) => {
    switch (rev.status) {
        case "locked":
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case "published":
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

const Revision = (props: Object) => {
    const { revision: rev, form } = props;
    const { icon, text: tooltipText } = getIcon(rev);
    const {
        publishRevision,
        createRevision,
        deleteRevision,
        editRevision,
        unpublishRevision
    } = useRevision({ revision: rev, form });

    return (
        <ListItem>
            <ListItemGraphic>
                <Tooltip content={tooltipText} placement={"bottom"}>
                    {icon}
                </Tooltip>
            </ListItemGraphic>
            <ListItemText>
                <ListItemTextPrimary>{rev.name}</ListItemTextPrimary>
                <ListItemTextSecondary>
                    Last modified <TimeAgo datetime={rev.savedOn} /> (#
                    {rev.version})
                </ListItemTextSecondary>
            </ListItemText>
            <ListItemMeta>
                <Menu
                    handle={<IconButton icon={<MoreVerticalIcon />} />}
                    className={revisionsMenu}
                    openSide={"left"}
                >
                    <MenuItem onClick={createRevision}>
                        <ListItemGraphic>
                            <Icon icon={<AddIcon />} />
                        </ListItemGraphic>
                        New from current
                    </MenuItem>
                    {rev.status === "draft" && (
                        <MenuItem onClick={editRevision}>
                            <ListItemGraphic>
                                <Icon icon={<EditIcon />} />
                            </ListItemGraphic>
                            Edit
                        </MenuItem>
                    )}

                    {rev.status !== "published" && (
                        <MenuItem onClick={() => publishRevision(rev)}>
                            <ListItemGraphic>
                                <Icon icon={<PublishIcon />} />
                            </ListItemGraphic>
                            Publish
                        </MenuItem>
                    )}

                    {rev.status === "published" && (
                        <ConfirmationDialog
                            title="Confirmation required!"
                            message={<span>Are you sure you want to unpublish this revision?</span>}
                        >
                            {({ showConfirmation }) => (
                                <MenuItem
                                    onClick={() => showConfirmation(() => unpublishRevision(rev))}
                                >
                                    <ListItemGraphic>
                                        <Icon icon={<UnpublishIcon />} />
                                    </ListItemGraphic>
                                    Unpublish
                                </MenuItem>
                            )}
                        </ConfirmationDialog>
                    )}

                    <MenuDivider />
                    <ConfirmationDialog
                        title="Confirmation required!"
                        message={<span>Are you sure you want to delete this revision?</span>}
                    >
                        {({ showConfirmation }) => (
                            <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                <ListItemGraphic>
                                    <Icon icon={<DeleteIcon />} />
                                </ListItemGraphic>
                                Delete
                            </MenuItem>
                        )}
                    </ConfirmationDialog>
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default Revision;

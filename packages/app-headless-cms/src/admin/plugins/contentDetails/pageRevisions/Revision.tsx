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
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/add.svg";
import { ReactComponent as EditIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/round-publish-24px.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/delete.svg";
import { ReactComponent as PreviewIcon } from "@webiny/app-headless-cms/admin/icons/__used__icons__/visibility.svg";

import { useRevisionHandlers } from "./useRevisionHandlers";
import { CmsContentModelModel } from "@webiny/app-headless-cms/types";

type RevisionProps = {
    rev: CmsContentModelModel;
};

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: CmsContentModelModel) => {
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

const Div = ({ children }) => {
    return <div>{children}</div>;
};

const Revision = ({ rev }: RevisionProps) => {
    const { icon, text: tooltipText } = getIcon(rev);
    const { deleteRevision, createRevision, publishRevision, editRevision } = useRevisionHandlers({
        rev
    });

    return (
        <ConfirmationDialog
            title="Confirmation required!"
            message={<span>Are you sure you want to delete this revision?</span>}
        >
            {({ showConfirmation }) => (
                <ListItem>
                    <ListItemGraphic>
                        <Tooltip content={tooltipText} placement={"bottom"}>
                            {icon}
                        </Tooltip>
                    </ListItemGraphic>
                    <ListItemText>
                        <ListItemTextPrimary>{rev.title}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            Last modified <TimeAgo datetime={rev.savedOn} /> (#
                            {rev.version})
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <Menu
                            handle={<IconButton icon={<MoreVerticalIcon />} />}
                            className={revisionsMenu}
                            /*openSide={"left"} TODO: @adrian */
                        >
                            <MenuItem onClick={createRevision}>
                                <ListItemGraphic>
                                    <Icon icon={<AddIcon />} />
                                </ListItemGraphic>
                                New from current
                            </MenuItem>
                            {!rev.locked && (
                                <MenuItem onClick={editRevision}>
                                    <ListItemGraphic>
                                        <Icon icon={<EditIcon />} />
                                    </ListItemGraphic>
                                    Edit
                                </MenuItem>
                            )}

                            {!rev.published && (
                                <MenuItem onClick={() => publishRevision(rev)}>
                                    <ListItemGraphic>
                                        <Icon icon={<PublishIcon />} />
                                    </ListItemGraphic>
                                    Publish
                                </MenuItem>
                            )}

                            <MenuItem
                                onClick={() => {
                                    console.log("Go");
                                }}
                            >
                                <ListItemGraphic>
                                    <Icon icon={<PreviewIcon />} />
                                </ListItemGraphic>
                                Preview
                            </MenuItem>

                            {!rev.locked && rev.id !== rev.parent && (
                                <Div>
                                    <MenuDivider />
                                    <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                        <ListItemGraphic>
                                            <Icon icon={<DeleteIcon />} />
                                        </ListItemGraphic>
                                        Delete
                                    </MenuItem>
                                </Div>
                            )}
                        </Menu>
                    </ListItemMeta>
                </ListItem>
            )}
        </ConfirmationDialog>
    );
};

export default Revision;

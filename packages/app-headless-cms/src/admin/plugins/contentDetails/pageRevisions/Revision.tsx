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
import { ReactComponent as MoreVerticalIcon } from "@webiny/app-headless-cms/admin/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "@webiny/app-headless-cms/admin/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "@webiny/app-headless-cms/admin/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "@webiny/app-headless-cms/admin/icons/gesture.svg";
import { ReactComponent as AddIcon } from "@webiny/app-headless-cms/admin/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/app-headless-cms/admin/icons/edit.svg";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/round-publish-24px.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";
import { ReactComponent as PreviewIcon } from "@webiny/app-headless-cms/admin/icons/visibility.svg";

import { useRevisionHandlers } from "./useRevisionHandlers";
import { CmsContentModelModel } from "@webiny/app-headless-cms/types";

type RevisionProps = {
    content: any;
    dataList: any;
    contentModel: CmsContentModelModel;
};

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: CmsContentModelModel) => {
    switch (true) {
        case rev.meta.locked && !rev.meta.published:
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case rev.meta.published:
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

const Revision = ({ contentModel, content, dataList }: RevisionProps) => {
    const { icon, text: tooltipText } = getIcon(content);
    const { deleteContent, createContent, publishRevision, updateContent } = useRevisionHandlers({
        content,
        contentModel,
        dataList
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
                        <ListItemTextPrimary>{content.title}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            Last modified <TimeAgo datetime={content.savedOn} /> (#
                            {content.version})
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <Menu
                            handle={<IconButton icon={<MoreVerticalIcon />} />}
                            className={revisionsMenu}
                        >
                            <MenuItem onClick={createContent}>
                                <ListItemGraphic>
                                    <Icon icon={<AddIcon />} />
                                </ListItemGraphic>
                                New from current
                            </MenuItem>
                            {!content.meta.locked && (
                                <MenuItem
                                    onClick={() => {
                                        updateContent; // TODO: Fix this
                                    }}
                                >
                                    <ListItemGraphic>
                                        <Icon icon={<EditIcon />} />
                                    </ListItemGraphic>
                                    Edit
                                </MenuItem>
                            )}

                            {!content.meta.published && (
                                <MenuItem onClick={() => publishRevision(content)}>
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

                            {!content.locked && content.id !== content.parent && (
                                <Div>
                                    <MenuDivider />
                                    <MenuItem onClick={() => showConfirmation(deleteContent)}>
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

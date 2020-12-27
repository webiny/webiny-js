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
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/app-headless-cms/admin/icons/unpublish.svg";
import { ReactComponent as DeleteIcon } from "@webiny/app-headless-cms/admin/icons/delete.svg";
import { CmsEditorContentModel, CmsEditorContentEntry } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
import { useRevision } from "./useRevision";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: CmsEditorContentEntry) => {
    switch (true) {
        case rev.meta.locked && rev.meta.status !== "published":
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case rev.meta.status === "published":
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

type Props = {
    revision: CmsEditorContentEntry;
    setLoading: (loading: boolean) => void;
    getLoading: () => boolean;
    entry: CmsEditorContentEntry;
    refetchContent: () => void;
    contentModel: CmsEditorContentModel;
    state: any;
    setState: (state: any) => void;
    switchTab: (index: number) => void;
};

const Revision = (props: Props) => {
    const { revision, setLoading, contentModel, entry, switchTab } = props;
    const {
        createRevision,
        deleteRevision,
        publishRevision,
        unpublishRevision,
        editRevision
    } = useRevision({
        contentModel,
        entry,
        revision,
        setLoading
    });
    const { icon, text: tooltipText } = getIcon(revision);

    return (
        <ConfirmationDialog
            title={t`Confirmation required!`}
            message={
                <span>
                    {t`You are about to delete revision {revision}. Are you sure you want to continue?`(
                        { revision: <strong>#{revision.meta.version}</strong> }
                    )}
                </span>
            }
        >
            {({ showConfirmation }) => (
                <ListItem>
                    <ListItemGraphic>
                        <Tooltip content={tooltipText} placement={"bottom"}>
                            {icon}
                        </Tooltip>
                    </ListItemGraphic>
                    <ListItemText>
                        <ListItemTextPrimary>{revision.meta.title || t`N/A`}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            {t`Last modified: {time} (#{version})`({
                                time: <TimeAgo datetime={revision.savedOn} />,
                                version: revision.meta.version
                            })}
                        </ListItemTextSecondary>
                    </ListItemText>
                    <ListItemMeta>
                        <Menu
                            handle={<IconButton icon={<MoreVerticalIcon />} />}
                            className={revisionsMenu}
                        >
                            <MenuItem onClick={createRevision}>
                                <ListItemGraphic>
                                    <Icon icon={<AddIcon />} />
                                </ListItemGraphic>
                                {t`New from current`}
                            </MenuItem>

                            {!revision.meta.locked && (
                                <MenuItem
                                    onClick={() => {
                                        editRevision();
                                        switchTab(0);
                                    }}
                                >
                                    <ListItemGraphic>
                                        <Icon icon={<EditIcon />} />
                                    </ListItemGraphic>
                                    {t` Edit`}
                                </MenuItem>
                            )}

                            {revision.meta.status !== "published" && (
                                <MenuItem onClick={publishRevision}>
                                    <ListItemGraphic>
                                        <Icon icon={<PublishIcon />} />
                                    </ListItemGraphic>
                                    {t`Publish`}
                                </MenuItem>
                            )}

                            {revision.meta.status === "published" && (
                                <MenuItem onClick={unpublishRevision}>
                                    <ListItemGraphic>
                                        <Icon icon={<UnpublishIcon />} />
                                    </ListItemGraphic>
                                    {t`Unpublish`}
                                </MenuItem>
                            )}

                            {!revision.meta.locked && (
                                <div>
                                    <MenuDivider />
                                    <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                        <ListItemGraphic>
                                            <Icon icon={<DeleteIcon />} />
                                        </ListItemGraphic>
                                        {t` Delete`}
                                    </MenuItem>
                                </div>
                            )}
                        </Menu>
                    </ListItemMeta>
                </ListItem>
            )}
        </ConfirmationDialog>
    );
};

export default Revision;

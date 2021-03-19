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
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "~/admin/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "~/admin/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "~/admin/icons/gesture.svg";
import { ReactComponent as AddIcon } from "~/admin/icons/add.svg";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as PublishIcon } from "~/admin/icons/publish.svg";
import { ReactComponent as UnpublishIcon } from "~/admin/icons/unpublish.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { CmsEditorContentModel, CmsEditorContentEntry } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { useRevision } from "./useRevision";
import usePermission from "~/admin/hooks/usePermission";

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
    listQueryVariables: any;
};

const Revision = (props: Props) => {
    const { revision, setLoading, contentModel, entry, switchTab, listQueryVariables } = props;
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
        setLoading,
        listQueryVariables
    });
    const { canEdit, canDelete, canPublish, canUnpublish } = usePermission();
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
                            {t`Last modified {time} (#{version})`({
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
                            {canEdit(entry, "cms.contentEntry") && (
                                <MenuItem onClick={createRevision}>
                                    <ListItemGraphic>
                                        <Icon icon={<AddIcon />} />
                                    </ListItemGraphic>
                                    {t`New from current`}
                                </MenuItem>
                            )}

                            {!revision.meta.locked && canEdit(entry, "cms.contentEntry") && (
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

                            {revision.meta.status !== "published" &&
                                canPublish("cms.contentEntry") && (
                                    <MenuItem onClick={() => publishRevision(revision.id)}>
                                        <ListItemGraphic>
                                            <Icon icon={<PublishIcon />} />
                                        </ListItemGraphic>
                                        {t`Publish`}
                                    </MenuItem>
                                )}

                            {revision.meta.status === "published" &&
                                canUnpublish("cms.contentEntry") && (
                                    <MenuItem onClick={unpublishRevision}>
                                        <ListItemGraphic>
                                            <Icon icon={<UnpublishIcon />} />
                                        </ListItemGraphic>
                                        {t`Unpublish`}
                                    </MenuItem>
                                )}

                            {!revision.meta.locked && canDelete(entry, "cms.contentEntry") && (
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

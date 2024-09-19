import React from "react";
import { css } from "emotion";
import { Date } from "@webiny/ui/DateTime";
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
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as MoreVerticalIcon } from "~/admin/icons/more_vert.svg";
import { ReactComponent as LockIcon } from "~/admin/icons/lock.svg";
import { ReactComponent as BeenHereIcon } from "~/admin/icons/beenhere.svg";
import { ReactComponent as GestureIcon } from "~/admin/icons/gesture.svg";
import { ReactComponent as AddIcon } from "~/admin/icons/add.svg";
import { ReactComponent as EditIcon } from "~/admin/icons/edit.svg";
import { ReactComponent as UnpublishIcon } from "~/admin/icons/unpublish.svg";
import { ReactComponent as DeleteIcon } from "~/admin/icons/delete.svg";
import { CmsContentEntryRevision } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { useRevision } from "./useRevision";
import { usePermission } from "~/admin/hooks/usePermission";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { PublishEntryRevisionListItem } from "./PublishEntryRevisionListItem";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 300,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: CmsContentEntryRevision) => {
    switch (true) {
        case rev.meta.locked && rev.meta.status !== "published":
            return {
                icon: <Icon icon={<LockIcon />} data-testid={"cms.revision.status.locked"} />,
                text: "This revision is locked (it has already been published)"
            };
        case rev.meta.status === "published":
            return {
                icon: (
                    <Icon
                        icon={<BeenHereIcon />}
                        className={primaryColor}
                        data-testid={"cms.revision.status.published"}
                    />
                ),
                text: "This revision is currently published!"
            };
        default:
            return {
                icon: <Icon icon={<GestureIcon />} data-testid={"cms.revision.status.draft"} />,
                text: "This is a draft"
            };
    }
};

interface RevisionListItemProps {
    revision: CmsContentEntryRevision;
}

const RevisionListItem = ({ revision }: RevisionListItemProps) => {
    const { createRevision, deleteRevision, publishRevision, unpublishRevision, editRevision } =
        useRevision({
            revision
        });

    const { entry, setActiveTab } = useContentEntry();
    const { canEdit, canDelete, canPublish, canUnpublish } = usePermission();
    const { icon, text: tooltipText } = getIcon(revision);

    return (
        <ListItem>
            <ListItemGraphic>
                <Tooltip content={tooltipText} placement={"bottom"}>
                    {icon}
                </Tooltip>
            </ListItemGraphic>
            <ListItemText>
                <ListItemTextPrimary>{revision.meta.title || t`N/A`}</ListItemTextPrimary>
                <ListItemTextSecondary>
                    {t`Last modified by {author} on {time} (#{version})`({
                        // Added this because revisionCreatedBy can be returned as null from GraphQL.
                        author: revision.revisionCreatedBy?.displayName,
                        time: <Date date={revision.revisionSavedOn} />,
                        version: revision.meta.version
                    })}
                </ListItemTextSecondary>
            </ListItemText>
            <ListItemMeta>
                <Menu
                    handle={<IconButton icon={<MoreVerticalIcon />} />}
                    className={revisionsMenu}
                    data-testid={"cms.content-form.revisions.more-options"}
                >
                    {canEdit(entry, "cms.contentEntry") && (
                        <MenuItem
                            onClick={() => createRevision()}
                            data-testid={"cms.revision.create-revision"}
                        >
                            <ListItemGraphic>
                                <Icon icon={<AddIcon />} />
                            </ListItemGraphic>
                            {t`New revision from current`}
                        </MenuItem>
                    )}

                    {!revision.meta.locked && canEdit(entry, "cms.contentEntry") && (
                        <MenuItem
                            onClick={() => {
                                editRevision();
                                setActiveTab(0);
                            }}
                        >
                            <ListItemGraphic>
                                <Icon icon={<EditIcon />} />
                            </ListItemGraphic>
                            {t`Edit revision`}
                        </MenuItem>
                    )}

                    {revision.meta.status !== "published" && canPublish("cms.contentEntry") && (
                        <MenuItem onClick={() => publishRevision()}>
                            <PublishEntryRevisionListItem />
                        </MenuItem>
                    )}

                    {revision.meta.status === "published" && canUnpublish("cms.contentEntry") && (
                        <MenuItem
                            onClick={() => unpublishRevision()}
                            data-testid={"cms.revision.unpublish"}
                        >
                            <ListItemGraphic>
                                <Icon icon={<UnpublishIcon />} />
                            </ListItemGraphic>
                            {t`Unpublish revision`}
                        </MenuItem>
                    )}

                    {!revision.meta.locked && canDelete(entry, "cms.contentEntry") && (
                        <div>
                            <MenuDivider />
                            <MenuItem onClick={() => deleteRevision()}>
                                <ListItemGraphic>
                                    <Icon icon={<DeleteIcon />} />
                                </ListItemGraphic>
                                {t` Delete revision`}
                            </MenuItem>
                        </div>
                    )}
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default RevisionListItem;

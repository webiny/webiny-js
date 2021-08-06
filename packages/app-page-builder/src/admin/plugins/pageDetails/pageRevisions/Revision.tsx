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
import { ReactComponent as MoreVerticalIcon } from "../../../assets/more_vert.svg";
import { ReactComponent as LockIcon } from "../../../assets/lock.svg";
import { ReactComponent as BeenHereIcon } from "../../../assets/beenhere.svg";
import { ReactComponent as GestureIcon } from "../../../assets/gesture.svg";
import { useRevisionHandlers } from "./useRevisionHandlers";
import { useConfigureWebsiteUrlDialog } from "../../../hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "../../../hooks/usePageBuilderSettings";
import { useSiteStatus } from "../../../hooks/useSiteStatus";
import { ReactComponent as AddIcon } from "../../../assets/add.svg";
import { ReactComponent as EditIcon } from "../../../assets/edit.svg";
import { ReactComponent as PublishIcon } from "../../../assets/round-publish-24px.svg";
import { ReactComponent as UnpublishIcon } from "../../../assets/unpublish.svg";
import { ReactComponent as DeleteIcon } from "../../../assets/delete.svg";
import { ReactComponent as PreviewIcon } from "../../../assets/visibility.svg";
import { PbPageData, PbPageRevision } from "../../../../types";
import usePermission from "../../../../hooks/usePermission";

type RevisionProps = {
    revision: PbPageRevision;
    page: PbPageData;
};

const primaryColor = css({ color: "var(--mdc-theme-primary)" });

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const getIcon = (rev: PbPageRevision) => {
    const published = rev.status === "published";
    switch (true) {
        case rev.locked && !published:
            return {
                icon: <Icon icon={<LockIcon />} />,
                text: "This revision is locked (it has already been published)"
            };
        case published:
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

const Revision = ({ revision, page }: RevisionProps) => {
    const { icon, text: tooltipText } = getIcon(revision);
    const { getWebsiteUrl, getPageUrl } = usePageBuilderSettings();
    const [isSiteRunning, refreshSiteStatus] = useSiteStatus(getWebsiteUrl());

    const { deleteRevision, createRevision, publishRevision, unpublishRevision, editRevision } =
        useRevisionHandlers({
            revision,
            page
        });

    const { showConfigureWebsiteUrlDialog } = useConfigureWebsiteUrlDialog(
        getWebsiteUrl(),
        refreshSiteStatus
    );

    const { canPublish, canUnpublish, canDelete } = usePermission();

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
                        <ListItemTextPrimary>{revision.title}</ListItemTextPrimary>
                        <ListItemTextSecondary>
                            Last modified <TimeAgo datetime={revision.savedOn} />
                            (#{revision.version})
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
                                New from current
                            </MenuItem>
                            {!revision.locked && (
                                <MenuItem onClick={editRevision}>
                                    <ListItemGraphic>
                                        <Icon icon={<EditIcon />} />
                                    </ListItemGraphic>
                                    Edit
                                </MenuItem>
                            )}

                            {revision.status !== "published" && canPublish() && (
                                <MenuItem onClick={() => publishRevision(revision)}>
                                    <ListItemGraphic>
                                        <Icon icon={<PublishIcon />} />
                                    </ListItemGraphic>
                                    Publish
                                </MenuItem>
                            )}

                            {revision.status === "published" && canUnpublish() && (
                                <MenuItem onClick={() => unpublishRevision(revision)}>
                                    <ListItemGraphic>
                                        <Icon icon={<UnpublishIcon />} />
                                    </ListItemGraphic>
                                    Unpublish
                                </MenuItem>
                            )}

                            <MenuItem
                                onClick={() => {
                                    if (isSiteRunning) {
                                        window.open(
                                            getPageUrl({
                                                ...revision,
                                                path: page.path
                                            }),
                                            "_blank",
                                            "noopener"
                                        );
                                    } else {
                                        showConfigureWebsiteUrlDialog();
                                    }
                                }}
                            >
                                <ListItemGraphic>
                                    <Icon icon={<PreviewIcon />} />
                                </ListItemGraphic>
                                Preview
                            </MenuItem>

                            {canDelete(page) && !revision.locked && (
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

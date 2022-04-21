import React from "react";
import { css } from "emotion";
/**
 * Package timeago-react does not have types.
 */
// @ts-ignore
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
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";
import { useRevisionHandlers } from "./useRevisionHandlers";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { ReactComponent as AddIcon } from "~/admin/assets/add.svg";
import { ReactComponent as EditIcon } from "~/admin/assets/edit.svg";
import { ReactComponent as UnpublishIcon } from "~/admin/assets/unpublish.svg";
import { ReactComponent as DeleteIcon } from "~/admin/assets/delete.svg";
import { ReactComponent as PreviewIcon } from "~/admin/assets/visibility.svg";
import { PbPageData, PbPageRevision } from "~/types";
import usePermission from "~/hooks/usePermission";
import { PublishPageMenuOption } from "./PublishPageMenuOption";
import { PageRevisionListItemGraphic } from "./PageRevisionListItemGraphic";

type RevisionProps = {
    revision: PbPageRevision;
    page: PbPageData;
};

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const Div: React.FC = ({ children }) => {
    return <div>{children}</div>;
};

const Revision: React.FC<RevisionProps> = ({ revision, page }) => {
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

    const { canUnpublish, canDelete } = usePermission();

    return (
        <ConfirmationDialog
            title="Confirmation required!"
            message={<span>Are you sure you want to delete this revision?</span>}
        >
            {({ showConfirmation }) => (
                <ListItem>
                    <PageRevisionListItemGraphic revision={revision} />
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

                            <PublishPageMenuOption
                                revision={revision}
                                publishRevision={publishRevision}
                            />

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

                            {canDelete(page) && (
                                <Div>
                                    <MenuDivider />
                                    <MenuItem onClick={() => showConfirmation(deleteRevision)}>
                                        <ListItemGraphic>
                                            <Icon icon={<DeleteIcon />} />
                                        </ListItemGraphic>
                                        Delete Revision
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

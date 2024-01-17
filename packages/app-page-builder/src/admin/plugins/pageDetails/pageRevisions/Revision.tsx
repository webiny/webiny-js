import React, { useCallback } from "react";
import { css } from "emotion";
import { TimeAgo } from "@webiny/ui/TimeAgo";
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
import { usePagesPermissions } from "~/hooks/permissions";
import { PublishPageMenuOption } from "./PublishPageMenuOption";
import { PageRevisionListItemGraphic } from "./PageRevisionListItemGraphic";
import { useFolders } from "@webiny/app-aco";

type RevisionProps = {
    revision: PbPageRevision;
    page: PbPageData;
};

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

interface DivProps {
    children: React.ReactNode;
}

const Div = ({ children }: DivProps) => {
    return <div>{children}</div>;
};

const Revision = ({ revision, page }: RevisionProps) => {
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

    const { canUnpublish, canDelete } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();

    // We must prevent opening in new tab - Cypress doesn't work with new tabs.
    const target = "Cypress" in window ? "_self" : "_blank";
    const url = getPageUrl({ id: revision.id, status: revision.status, path: page.path });

    const handlePreviewClick = useCallback(() => {
        if (isSiteRunning) {
            window.open(url, target, "noopener");
        } else {
            showConfigureWebsiteUrlDialog();
        }
    }, [url, isSiteRunning]);

    const previewButtonLabel = revision.status === "published" ? "View" : "Preview";

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
                            {flp.canManageContent(page.wbyAco_location?.folderId) && (
                                <>
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
                                </>
                            )}

                            <MenuItem onClick={handlePreviewClick}>
                                <ListItemGraphic>
                                    <Icon icon={<PreviewIcon />} />
                                </ListItemGraphic>
                                {previewButtonLabel}
                            </MenuItem>

                            {canDelete(page?.createdBy?.id) &&
                                flp.canManageContent(page.wbyAco_location?.folderId) && (
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

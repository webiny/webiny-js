import React, { useCallback } from "react";
import { css } from "emotion";
import { TimeAgo } from "@webiny/ui/TimeAgo";
import {
    ListItem,
    ListItemMeta,
    ListItemText,
    ListItemTextPrimary,
    ListItemTextSecondary
} from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { Menu } from "@webiny/ui/Menu";
import { ReactComponent as MoreVerticalIcon } from "~/admin/assets/more_vert.svg";
import { useRevisionHandlers } from "./useRevisionHandlers";
import { useConfigureWebsiteUrlDialog } from "~/admin/hooks/useConfigureWebsiteUrl";
import { usePageBuilderSettings } from "~/admin/hooks/usePageBuilderSettings";
import { useSiteStatus } from "~/admin/hooks/useSiteStatus";
import { PbPageData, PbPageRevision } from "~/types";
import {
    SecureDeleteRevisionMenuOption,
    SecureEditRevisionMenuOption,
    SecureNewRevisionFromCurrent,
    PreviewRevisionMenuOption,
    SecurePublishPageMenuOption,
    SecureUnpublishPageMenuOption
} from "./MenuOptions";
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

    return (
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
                <Menu handle={<IconButton icon={<MoreVerticalIcon />} />} className={revisionsMenu}>
                    <SecureNewRevisionFromCurrent page={page} createRevision={createRevision} />
                    <SecureEditRevisionMenuOption
                        page={page}
                        revision={revision}
                        editRevision={editRevision}
                    />
                    <SecurePublishPageMenuOption
                        page={page}
                        revision={revision}
                        publishRevision={publishRevision}
                    />
                    <SecureUnpublishPageMenuOption
                        page={page}
                        revision={revision}
                        unpublishRevision={unpublishRevision}
                    />
                    <PreviewRevisionMenuOption
                        revision={revision}
                        previewRevision={handlePreviewClick}
                    />
                    <SecureDeleteRevisionMenuOption page={page} deleteRevision={deleteRevision} />
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default Revision;

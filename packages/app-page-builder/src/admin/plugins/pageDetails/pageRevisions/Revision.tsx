import React from "react";
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
import {
    PreviewRevisionMenuOption,
    SecureDeleteRevisionMenuOption,
    SecureEditRevisionMenuOption,
    SecureNewRevisionFromCurrent,
    SecurePublishPageMenuOption,
    SecureUnpublishPageMenuOption
} from "./MenuOptions";
import { PageRevisionListItemGraphic } from "./PageRevisionListItemGraphic";
import { usePage } from "~/admin/views/Pages/PageDetails";
import { useRevision } from "./RevisionsList";

const revisionsMenu = css({
    width: 250,
    right: -105,
    left: "auto !important"
});

const Revision = () => {
    const { page } = usePage();
    const { revision } = useRevision();

    const { deleteRevision, createRevision, publishRevision, unpublishRevision, editRevision } =
        useRevisionHandlers({
            revision,
            page
        });

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
                    <SecurePublishPageMenuOption onClick={publishRevision} />
                    <SecureUnpublishPageMenuOption
                        page={page}
                        revision={revision}
                        unpublishRevision={unpublishRevision}
                    />
                    <PreviewRevisionMenuOption />
                    <SecureDeleteRevisionMenuOption page={page} deleteRevision={deleteRevision} />
                </Menu>
            </ListItemMeta>
        </ListItem>
    );
};

export default Revision;

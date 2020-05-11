import React, { useState, useCallback, useMemo } from "react";
import PublishRevisionDialog from "./PublishRevisionDialog";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/publish.svg";
import { get } from "lodash";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { createPublishMutation } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

function getPublishSuggestion(page, revisions) {
    if (!page.published) {
        return page.id;
    }

    if (revisions[0]) {
        return revisions[0].id;
    }

    return "";
}

function getPublishableRevisions(revisions) {
    return revisions
        .filter(r => !r.meta.published)
        .sort((a, b) => {
            // @ts-ignore
            return new Date(b.savedOn) - new Date(a.savedOn);
        });
}

const PublishRevision = ({ content, contentModel, getLoading, setLoading }) => {
    const { showSnackbar } = useSnackbar();

    const PUBLISH_CONTENT = useMemo(() => {
        return createPublishMutation(contentModel);
    }, [contentModel.modelId]);

    const [publishContentMutation] = useMutation(PUBLISH_CONTENT);

    const onPublish = useCallback(
        async revision => {
            setLoading(true);
            const response = await publishContentMutation({
                variables: { revision: revision.id }
            });

            const content = get(response, "data.content");
            setLoading(false);
            if (content.error) {
                return showSnackbar(content.error.message);
            }

            showSnackbar(t`Content published successfully.`);
        },
        [contentModel.id]
    );

    const publishableRevisions = getPublishableRevisions(get(content, "meta.revisions") || []);
    const publishSuggestion = getPublishSuggestion(content, publishableRevisions);
    const [openDialog, setOpenDialog] = useState(false);

    const showDialog = useCallback(() => setOpenDialog(true), []);
    const hideDialog = useCallback(() => setOpenDialog(false), []);

    return (
        <React.Fragment>
            <Tooltip
                content={publishableRevisions.length ? t`Publish` : t`No revisions to publish`}
                placement={"top"}
            >
                <IconButton
                    icon={<PublishIcon />}
                    onClick={showDialog}
                    disabled={!content.id || getLoading()}
                />
            </Tooltip>
            <PublishRevisionDialog
                open={openDialog}
                onClose={hideDialog}
                onSubmit={onPublish}
                selected={publishSuggestion}
                revisions={publishableRevisions}
            />
        </React.Fragment>
    );
};

export default PublishRevision;

import React, { useCallback, useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/publish.svg";
import { get } from "lodash";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { createPublishMutation } from "@webiny/app-headless-cms/admin/components/ContentModelForm/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { i18n } from "@webiny/app/i18n";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const PublishRevision = ({ content, contentModel, getLoading, setLoading, revisionsList }) => {
    const { showSnackbar } = useSnackbar();

    const { PUBLISH_CONTENT } = useMemo(() => {
        return {
            PUBLISH_CONTENT: createPublishMutation(contentModel)
        };
    }, [contentModel.modelId]);

    const [publishContentMutation] = useMutation(PUBLISH_CONTENT);

    const onPublish = useCallback(async () => {
        setLoading(true);
        const response = await publishContentMutation({
            variables: { revision: content.id }
        });

        const contentData = get(response, "data.content");
        setLoading(false);
        if (contentData.error) {
            return showSnackbar(contentData.error.message);
        }

        showSnackbar(t`Content published successfully.`);
        revisionsList.refetch();
    }, [content.id]);

    const { showConfirmation } = useConfirmationDialog({
        title: t`Publish content`,
        message: (
            <p>{t`You are about to publish a new revision. Are you sure you want to continue?`}</p>
        )
    });

    return (
        <React.Fragment>
            <Tooltip content={t`Publish`} placement={"top"}>
                <IconButton
                    icon={<PublishIcon />}
                    onClick={() => showConfirmation(onPublish)}
                    disabled={!content.id || getLoading()}
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default PublishRevision;

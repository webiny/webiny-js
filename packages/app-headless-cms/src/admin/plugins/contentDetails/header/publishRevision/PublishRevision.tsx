import React, { useCallback, useMemo } from "react";
import { get } from "lodash";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-headless-cms/admin/icons/publish.svg";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { createPublishMutation } from "../../../../views/components/ContentModelForm/graphql";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const PublishRevision = ({ entry, contentModel, getLoading, setLoading }) => {
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
            variables: { revision: entry.id }
        });

        setLoading(false);
        
        const contentData = get(response, "data.content");
        if (contentData.error) {
            return showSnackbar(contentData.error.message);
        }

        showSnackbar(t`Content published successfully.`);
    }, [entry.id]);

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
                    disabled={!entry.id || getLoading()}
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default PublishRevision;

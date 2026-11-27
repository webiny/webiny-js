import React from "react";
import { ReactComponent as ContentReviewsIcon } from "@webiny/icons/flowchart.svg";
import { useFeature } from "@webiny/app";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { useModel } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ReviewContentReviewsOverlaySidebarItem } from "@webiny/app-workflows/review/mounting/components/ReviewContentReviewsOverlaySidebarItem.js";
import { CmsReviewFeature } from "~/features/gateway/feature.js";
import { createAppName } from "~/utils/appName.js";

const { Browser } = ContentEntryListConfig;

// Opens the reviews of the entries list's model in an overlay over the list, as the trash bin does.
const ContentReviewsSidebarOverlay = () => {
    const { model } = useModel();
    const { rowProvider } = useFeature(CmsReviewFeature);
    const namespaces = [createAppName(model)];

    return (
        <IsModelPublishable>
            <ReviewContentReviewsOverlaySidebarItem
                app={"cms"}
                rowProvider={rowProvider}
                namespaces={namespaces}
                fixedContentTypeId={model.modelId}
                title={`Content Reviews - ${model.name}`}
                icon={<ContentReviewsIcon />}
            />
        </IsModelPublishable>
    );
};

// The "Content Reviews" item of the content entries sidebar; it opens the model's reviews overlay.
export const CmsContentReviewsSidebarItem = () => {
    return (
        <ContentEntryListConfig>
            <Browser.Sidebar.Footer
                name={"content-reviews"}
                element={<ContentReviewsSidebarOverlay />}
            />
        </ContentEntryListConfig>
    );
};

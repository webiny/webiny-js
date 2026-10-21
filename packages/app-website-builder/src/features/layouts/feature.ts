import { createFeature } from "@webiny/feature/admin";
import { SharedLayoutsInfrastructureFeature } from "./shared/feature.js";
import { ListLayoutsFeature } from "./listLayouts/feature.js";
import { GetLayoutFeature } from "./getLayout/feature.js";
import { GetLayoutRevisionsFeature } from "./getLayoutRevisions/feature.js";
import { CreateLayoutFeature } from "./createLayout/feature.js";
import { UpdateLayoutFeature } from "./updateLayout/feature.js";
import { PublishLayoutFeature } from "./publishLayout/feature.js";
import { UnpublishLayoutFeature } from "./unpublishLayout/feature.js";
import { CreateLayoutRevisionFromFeature } from "./createLayoutRevisionFrom/feature.js";
import { DeleteLayoutRevisionFeature } from "./deleteLayoutRevision/feature.js";
import { DeleteLayoutFeature } from "./deleteLayout/feature.js";
import { DuplicateLayoutFeature } from "./duplicateLayout/feature.js";
import { TranslateLayoutFeature } from "./translateLayout/feature.js";
import { GetPageLayoutFeature } from "./getPageLayout/feature.js";
import { GetLayoutSettingsFeature } from "./getLayoutSettings/feature.js";
import { SetDefaultLayoutFeature } from "./setDefaultLayout/feature.js";
import { LayoutPreviewPagesFeature } from "./previewPages/feature.js";

export const LayoutsFeature = createFeature({
    name: "WebsiteBuilder/Layouts",
    register(container) {
        SharedLayoutsInfrastructureFeature.register(container);

        ListLayoutsFeature.register(container);
        GetLayoutFeature.register(container);
        GetLayoutRevisionsFeature.register(container);
        CreateLayoutFeature.register(container);
        UpdateLayoutFeature.register(container);
        PublishLayoutFeature.register(container);
        UnpublishLayoutFeature.register(container);
        CreateLayoutRevisionFromFeature.register(container);
        DeleteLayoutRevisionFeature.register(container);
        DeleteLayoutFeature.register(container);
        DuplicateLayoutFeature.register(container);
        TranslateLayoutFeature.register(container);
        GetPageLayoutFeature.register(container);
        GetLayoutSettingsFeature.register(container);
        SetDefaultLayoutFeature.register(container);
        LayoutPreviewPagesFeature.register(container);
    }
});

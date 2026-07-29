import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldIndexFeature } from "./CmsEntryOpenSearchFieldIndex/feature.js";
import { CmsEntryOpenSearchFilterFeature } from "./CmsEntryOpenSearchFilter/feature.js";
import { CmsEntryOpenSearchIndexFeature } from "./CmsEntryOpenSearchIndex/feature.js";
import { CmsEntryOpenSearchIndexCreateFeature } from "./CmsEntryOpenSearchIndexCreate/feature.js";
import { CmsEntryOpenSearchIndexDeleteFeature } from "./CmsEntryOpenSearchIndexDelete/feature.js";
import { CmsEntryOpenSearchFieldPathFactoryFeature } from "./CmsEntryOpenSearchFieldPathFactory/feature.js";
import { CmsEntryOpenSearchValueTransformerFeature } from "./CmsEntryOpenSearchValueTransformer/feature.js";
import { CmsEntryOpenSearchOperatorListFeature } from "./CmsEntryOpenSearchOperatorList/feature.js";
import { CmsEntryOpenSearchExecFilteringFeature } from "./CmsEntryOpenSearchExecFiltering/feature.js";
import { CmsEntryOpenSearchBodyBuilderFeature } from "./CmsEntryOpenSearchBodyBuilder/feature.js";
import { CmsEntryOpenSearchValueSearchFeature } from "./CmsEntryOpenSearchValueSearch/feature.js";
import { ModelAfterCreateHandler } from "./CmsEntryOpenSearchIndexCreate/ModelAfterCreateHandler.js";
import { ModelAfterCreateFromHandler } from "./CmsEntryOpenSearchIndexCreate/ModelAfterCreateFromHandler.js";
import { ModelAfterDeleteHandler } from "./CmsEntryOpenSearchIndexDelete/ModelAfterDeleteHandler.js";

export const CmsEntryOpenSearchUtilsFeature = createFeature({
    name: "Cms/Entry/OpenSearch/UtilsFeature",
    register: container => {
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchIndexCreateFeature.register(container);
        CmsEntryOpenSearchIndexDeleteFeature.register(container);
        CmsEntryOpenSearchFieldPathFactoryFeature.register(container);
        CmsEntryOpenSearchValueTransformerFeature.register(container);
        CmsEntryOpenSearchOperatorListFeature.register(container);
        CmsEntryOpenSearchExecFilteringFeature.register(container);
        CmsEntryOpenSearchBodyBuilderFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);

        // Model lifecycle event handlers for OpenSearch index management
        container.register(ModelAfterCreateHandler);
        container.register(ModelAfterCreateFromHandler);
        container.register(ModelAfterDeleteHandler);
    }
});

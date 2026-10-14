import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldIndexRegistry } from "./CmsEntryOpenSearchFieldIndexRegistry.js";
import { RichTextFieldIndex } from "./fields/RichTextFieldIndex.js";
import { JsonFieldIndex } from "./fields/JsonFieldIndex.js";
import { LongTextFieldIndex } from "./fields/LongTextFieldIndex.js";
import { NumberFieldIndex } from "./fields/NumberFieldIndex.js";
import { DefaultFieldIndex } from "./fields/DefaultFieldIndex.js";
import { DateTimeFieldIndex } from "./fields/DateTimeFieldIndex.js";
import { ObjectFieldIndex } from "./fields/ObjectFieldIndex.js";
import { TextCompressedFieldIndex } from "./fields/TextCompressedFieldIndex.js";
import { TextEncryptedFieldIndex } from "./fields/TextEncryptedFieldIndex.js";

export const CmsEntryOpenSearchFieldIndexFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FieldIndexFeature",
    register: container => {
        // Container scoped, so registering the feature once in the root still builds these per request:
        // several field indexes depend on the per-request CmsModelFieldToGraphQLRegistry, and the
        // registry collects field indexes that extensions register per request.
        container.register(RichTextFieldIndex).inContainerScope();
        container.register(JsonFieldIndex).inContainerScope();
        container.register(LongTextFieldIndex).inContainerScope();
        container.register(NumberFieldIndex).inContainerScope();
        container.register(DefaultFieldIndex).inContainerScope();
        container.register(DateTimeFieldIndex).inContainerScope();
        container.register(ObjectFieldIndex).inContainerScope();
        container.register(TextCompressedFieldIndex).inContainerScope();
        container.register(TextEncryptedFieldIndex).inContainerScope();

        // must be registered last
        container.register(CmsEntryOpenSearchFieldIndexRegistry).inContainerScope();
    }
});

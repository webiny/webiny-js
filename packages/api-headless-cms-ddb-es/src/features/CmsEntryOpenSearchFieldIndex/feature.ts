import { createFeature } from "@webiny/feature/api";
import { CmsEntryOpenSearchFieldIndexRegistry } from "./CmsEntryOpenSearchFieldIndexRegistry.js";
import { RichTextFieldIndex } from "./fields/RichTextFieldIndex.js";
import { JsonFieldIndex } from "./fields/JsonFieldIndex.js";
import { LongTextFieldIndex } from "./fields/LongTextFieldIndex.js";
import { NumberFieldIndex } from "./fields/NumberFieldIndex.js";
import { DefaultFieldIndex } from "./fields/DefaultFieldIndex.js";
import { DateTimeFieldIndex } from "./fields/DateTimeFieldIndex.js";
import { ObjectFieldIndex } from "./fields/ObjectFieldIndex.js";

export const CmsEntryOpenSearchFieldIndexFeature = createFeature({
    name: "Cms/Entry/OpenSearch/FieldIndexFeature",
    register: container => {
        container.register(RichTextFieldIndex);
        container.register(JsonFieldIndex);
        container.register(LongTextFieldIndex);
        container.register(NumberFieldIndex);
        container.register(DefaultFieldIndex);
        container.register(DateTimeFieldIndex);
        container.register(ObjectFieldIndex);
        container.register(CmsEntryOpenSearchFieldIndexRegistry);
    }
});

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
        container.register(RichTextFieldIndex).inSingletonScope();
        container.register(JsonFieldIndex).inSingletonScope();
        container.register(LongTextFieldIndex).inSingletonScope();
        container.register(NumberFieldIndex).inSingletonScope();
        container.register(DefaultFieldIndex).inSingletonScope();
        container.register(DateTimeFieldIndex).inSingletonScope();
        container.register(ObjectFieldIndex).inSingletonScope();
        container.register(TextCompressedFieldIndex).inSingletonScope();
        container.register(TextEncryptedFieldIndex).inSingletonScope();

        // must be registered last
        container.register(CmsEntryOpenSearchFieldIndexRegistry).inSingletonScope();
    }
});

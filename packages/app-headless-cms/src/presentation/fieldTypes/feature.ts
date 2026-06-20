import { createFeature } from "@webiny/feature/admin";
import { TextFieldType } from "./types/TextFieldType.js";
import { LongTextFieldType } from "./types/LongTextFieldType.js";
import { NumberFieldType } from "./types/NumberFieldType.js";
import { BooleanFieldType } from "./types/BooleanFieldType.js";
import { DateTimeFieldType } from "./types/DateTimeFieldType.js";
import { RefFieldType } from "./types/RefFieldType.js";
import { ObjectFieldType } from "./types/ObjectFieldType.js";
import { DynamicZoneFieldType } from "./types/DynamicZoneFieldType.js";
import { RichTextFieldType } from "./types/RichTextFieldType.js";
import { JsonFieldType } from "./types/JsonFieldType.js";
import { SearchableJsonFieldType } from "./types/SearchableJsonFieldType.js";
import { TextFieldSettingsModifier } from "./types/TextFieldSettingsModifier.js";
import { LongTextFieldSettingsModifier } from "./types/LongTextFieldSettingsModifier.js";
import { NumberFieldSettingsModifier } from "./types/NumberFieldSettingsModifier.js";
import { RichTextFieldSettingsModifier } from "./types/RichTextFieldSettingsModifier.js";
import { BooleanFieldSettingsModifier } from "./types/BooleanFieldSettingsModifier.js";
import { DateTimeFieldSettingsModifier } from "./types/DateTimeFieldSettingsModifier.js";
import { RefFieldSettingsModifier } from "./types/RefFieldSettingsModifier.js";

export const CmsFieldTypeFeature = createFeature({
    name: "CmsFieldTypes",
    register(container) {
        container.register(TextFieldType);
        container.register(LongTextFieldType);
        container.register(NumberFieldType);
        container.register(BooleanFieldType);
        container.register(DateTimeFieldType);
        container.register(RefFieldType);
        container.register(ObjectFieldType);
        container.register(DynamicZoneFieldType);
        container.register(RichTextFieldType);
        container.register(JsonFieldType);
        container.register(SearchableJsonFieldType);
        container.register(TextFieldSettingsModifier);
        container.register(LongTextFieldSettingsModifier);
        container.register(NumberFieldSettingsModifier);
        container.register(RichTextFieldSettingsModifier);
        container.register(BooleanFieldSettingsModifier);
        container.register(DateTimeFieldSettingsModifier);
        container.register(RefFieldSettingsModifier);
    }
});

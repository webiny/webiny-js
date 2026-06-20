import { createFeature } from "@webiny/feature/admin";
import {
    TextInputRenderer,
    TextInputsRenderer,
    TagsRenderer,
    LongTextRenderer,
    LongTextsRenderer,
    NumberInputRenderer,
    NumberInputsRenderer,
    BooleanSwitchRenderer,
    DateTimeInputRenderer,
    DateTimeInputsRenderer,
    SelectBoxRenderer,
    RadioButtonsRenderer,
    CheckboxesRenderer,
    HiddenRenderer,
    PassthroughRenderer,
    LexicalTextInputRenderer,
    LexicalTextInputsRenderer,
    ObjectAccordionRenderer,
    ObjectsAccordionRenderer,
    ObjectAccordionMultipleRenderer,
    DynamicZoneRenderer,
    RefInputRenderer,
    RefInputsRenderer,
    RefSimpleSingleRenderer,
    RefSimpleMultipleRenderer,
    RefDetailedSingleRenderer,
    RefDetailedMultipleRenderer
} from "./renderers/index.js";

export const CmsFieldRendererFeature = createFeature({
    name: "CmsFieldRenderers",
    register(container) {
        container.register(TextInputRenderer);
        container.register(TextInputsRenderer);
        container.register(TagsRenderer);
        container.register(LongTextRenderer);
        container.register(LongTextsRenderer);
        container.register(NumberInputRenderer);
        container.register(NumberInputsRenderer);
        container.register(BooleanSwitchRenderer);
        container.register(DateTimeInputRenderer);
        container.register(DateTimeInputsRenderer);
        container.register(SelectBoxRenderer);
        container.register(RadioButtonsRenderer);
        container.register(CheckboxesRenderer);
        container.register(HiddenRenderer);
        container.register(PassthroughRenderer);
        container.register(LexicalTextInputRenderer);
        container.register(LexicalTextInputsRenderer);
        container.register(ObjectAccordionRenderer);
        container.register(ObjectsAccordionRenderer);
        container.register(ObjectAccordionMultipleRenderer);
        container.register(DynamicZoneRenderer);
        container.register(RefInputRenderer);
        container.register(RefInputsRenderer);
        container.register(RefSimpleSingleRenderer);
        container.register(RefSimpleMultipleRenderer);
        container.register(RefDetailedSingleRenderer);
        container.register(RefDetailedMultipleRenderer);
    }
});

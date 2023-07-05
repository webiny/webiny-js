import richTextInput from "./richTextInput";
import richTextInputs from "./richTextInputs";
import { allowCmsLegacyRichTextInput } from "~/utils/allowCmsLegacyRichTextInput";

export const createLegacyRichTextInput = () => {
    return allowCmsLegacyRichTextInput ? [richTextInput, richTextInputs] : [];
};

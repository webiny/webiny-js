import { PostModifyElementArgs } from "../../elementSettings/useUpdateHandlers";

export const replaceFullIconObject = ({
    name,
    newElement,
    newValue
}: PostModifyElementArgs): void => {
    // If the icon value has changed, replace `icon.value` with `newValue.value`,
    // instead of performing the default merge of objects.
    if (newElement.data.icon && name === "icon") {
        newElement.data.icon.value = newValue.value;
    }
};

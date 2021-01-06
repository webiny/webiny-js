import { CmsModelFieldToStoragePlugin } from "@webiny/api-headless-cms/types";
import jsonpack from "jsonpack";
import WebinyError from "@webiny/error";

type StoragePackedValue = {
    compression?: string;
    value: any;
};
export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-rich-text",
    fieldType: "rich-text",
    async fromStorage({ field, value }): Promise<any> {
        if (!value) {
            return value;
        } else if (typeof value !== "object") {
            throw new WebinyError(
                `Value received in "fromStorage" function is not an object in field "${field.fieldId}".`
            );
        } else if (!value.compression) {
            throw new WebinyError(
                `Missing compression in "fromStorage" function in field "${field.fieldId}".`
            );
        }
        if (value.compression !== "jsonpack") {
            throw new WebinyError(
                `This plugin cannot transform something not packed with "jsonpack".`
            );
        }
        return jsonpack.unpack(value.value);
    },
    async toStorage({ value }): Promise<StoragePackedValue> {
        return {
            compression: "jsonpack",
            value: jsonpack.pack(value || {})
        };
    }
});

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
    async fromStorage({ value }: { value?: StoragePackedValue }): Promise<any> {
        if (typeof value !== "object") {
            throw new WebinyError(`Value received in "fromStorage" function is not a object.`);
        }
        if (!value.compression) {
            throw new WebinyError(`Missing compression in "fromStorage" function.`);
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
            value: jsonpack.pack(value)
        };
    }
});

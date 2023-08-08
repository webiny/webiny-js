import { createRichTextStorageTransformPlugin } from "./storage/richText";
import { createLongTextStorageTransformPlugin } from "./storage/longText";
import { createDateStorageTransformPlugin } from "./storage/date";

export default () => createDynamoDbPlugins();

export const createDynamoDbPlugins = () => {
    return [
        createRichTextStorageTransformPlugin(),
        createLongTextStorageTransformPlugin(),
        createDateStorageTransformPlugin()
    ];
};

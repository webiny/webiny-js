import { createRichTextStorageTransformPlugin } from "./storage/richText";
import { createLongTextStorageTransformPlugin } from "./storage/longText";
import { createDateStorageTransformPlugin } from "./storage/date";

export default () => [
    createRichTextStorageTransformPlugin(),
    createLongTextStorageTransformPlugin(),
    createDateStorageTransformPlugin()
];

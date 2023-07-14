import { createRichTextStorageTransformPlugin } from "./storage/richText";
import { createLongTextStorageTransformPlugin } from "./storage/longText";
import { createDateStorageTransformPlugin } from "./storage/date";
import { createPlainObjectPathPlugin } from "./path/plainObject";
import { createDatetimeTransformValuePlugin } from "./transformValue/datetime";
import { createLocationFolderIdPathPlugin } from "~/dynamoDb/path/locationFolderId";

export default () => [
    createRichTextStorageTransformPlugin(),
    createLongTextStorageTransformPlugin(),
    createDateStorageTransformPlugin(),
    createPlainObjectPathPlugin(),
    createLocationFolderIdPathPlugin(),
    createDatetimeTransformValuePlugin()
];

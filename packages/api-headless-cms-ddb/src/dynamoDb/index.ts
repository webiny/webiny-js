import { createPlainObjectPathPlugin } from "./path/plainObject.js";
import { createDatetimeTransformValuePlugin } from "./transformValue/datetime.js";
import { createLocationFolderIdPathPlugin } from "~/dynamoDb/path/locationFolderId.js";

export default () => [
    createPlainObjectPathPlugin(),
    createLocationFolderIdPathPlugin(),
    createDatetimeTransformValuePlugin()
];

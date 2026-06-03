import { createPlainObjectPathPlugin } from "@webiny/db-utils";
import { createLocationFolderIdPathPlugin } from "@webiny/db-utils";
import { createDatetimeTransformValuePlugin } from "@webiny/db-utils";

export default () => [
    createPlainObjectPathPlugin(),
    createLocationFolderIdPathPlugin(),
    createDatetimeTransformValuePlugin()
];

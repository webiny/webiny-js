import { createPlainObjectPathPlugin } from "@webiny/api-headless-cms-storage";
import { createLocationFolderIdPathPlugin } from "@webiny/api-headless-cms-storage";
import { createDatetimeTransformValuePlugin } from "@webiny/api-headless-cms-storage";

export default () => [
    createPlainObjectPathPlugin(),
    createLocationFolderIdPathPlugin(),
    createDatetimeTransformValuePlugin()
];

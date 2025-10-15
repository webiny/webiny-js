import icons from "./icons.js";
import install from "./install.js";
import contentFormTransformers from "./transformers/index.js";
import defaultBar from "./editor/defaultBar/index.js";
import formSettings from "./editor/formSettings/index.js";
import permissionRenderer from "./permissionRenderer/index.js";
import getObjectId from "./getObjectId.js";

export default () => [
    install,
    icons,
    contentFormTransformers(),
    defaultBar,
    formSettings,
    permissionRenderer,
    getObjectId
];

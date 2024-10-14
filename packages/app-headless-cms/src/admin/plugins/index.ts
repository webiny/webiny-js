import routes from "./routes";
import install from "./install";
import contentFormTransformers from "./transformers";
import defaultBar from "./editor/defaultBar";
import formSettings from "./editor/formSettings";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";

export default () => [
    install,
    routes,
    contentFormTransformers(),
    defaultBar,
    formSettings,
    permissionRenderer,
    getObjectId
];

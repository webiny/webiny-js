import routes from "./routes";
import icons from "./icons";
import install from "./install";
import contentFormTransformers from "./transformers";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";
import contentEntryHeader from "../views/contentEntries/ContentEntry/header";

export default () => [
    install,
    routes,
    icons,
    contentFormTransformers(),
    permissionRenderer,
    getObjectId,
    contentEntryHeader
];

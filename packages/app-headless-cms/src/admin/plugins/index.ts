import routes from "./routes";
import menus from "./menus";
import icons from "./icons";
import install from "./install";
import contentFormTransformers from "./transformers";
import defaultBar from "./editor/defaultBar";
import formSettings from "./editor/formSettings";
import apiInformation from "./apiInformation";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";
import contentEntryHeader from "../views/contentEntries/ContentEntry/header";

export default () => [
    install,
    routes,
    menus,
    icons,
    contentFormTransformers(),
    defaultBar,
    formSettings,
    permissionRenderer,
    apiInformation,
    getObjectId,
    contentEntryHeader
];

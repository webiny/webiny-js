import routes from "./routes";
import menus from "./menus";
import icons from "./icons";
import install from "./install";
import revisionContent from "./contentDetails/revisionContent";
import header from "./contentDetails/header";
import contentForm from "./contentDetails/contentForm";
import contentFormTransformers from "./contentDetails/contentForm/transformers";
import contentRevisions from "./contentDetails/contentRevisions";
import defaultBar from "./editor/defaultBar";
import formSettings from "./editor/formSettings";
import apiInformation from "./apiInformation";
import permissionRenderer from "./permissionRenderer";
import getObjectId from "./getObjectId";

export default () => [
    install,
    routes,
    menus,
    icons,
    header,
    revisionContent,
    contentForm,
    contentFormTransformers(),
    contentRevisions,
    defaultBar,
    formSettings,
    permissionRenderer,
    apiInformation,
    getObjectId
];

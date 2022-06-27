import header from "./pageDetails/header";
import revisionContent from "./pageDetails/revisionContent";
import previewContent from "./pageDetails/previewContent";
import pageRevisions from "./pageDetails/pageRevisions";
import menuItems from "./menuItems";
import globalSearch from "./globalSearch";
import routes from "./routes";
import installation from "./installation";
import permissionRenderer from "./permissionRenderer";

export default () => [
    header,
    revisionContent,
    previewContent,
    pageRevisions,
    menuItems,
    globalSearch,
    routes,
    installation,
    permissionRenderer
];

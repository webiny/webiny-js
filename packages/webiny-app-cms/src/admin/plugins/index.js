// @flow
import header from "./pageDetails/header";
import revisionContent from "./pageDetails/revisionContent";
import previewContent from "./pageDetails/previewContent";
import pageRevisions from "./pageDetails/pageRevisions";
import icons from "./icons";
import menuItems from "./menuItems";
import globalSearch from "./globalSearch";

export default [
    ...header,
    revisionContent,
    ...previewContent,
    pageRevisions,
    icons,
    ...menuItems,
    ...globalSearch
];

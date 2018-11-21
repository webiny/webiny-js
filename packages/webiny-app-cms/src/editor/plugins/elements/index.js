// @flow
import document from "./document";
import row from "./row";
import block from "./block";
import column from "./column";
import image from "./image";
import text from "./text";
import icon from "./icon";
import spacer from "./spacer";
import button from "./button";
import media from "./media";
import social from "./social";
import code from "./code";
import pagesList from "./pagesList";

export default [
    document(),
    row(),
    block(),
    column(),
    ...icon(),
    ...image(),
    text(),
    spacer(),
    ...button(),
    ...media,
    ...social,
    ...code,
    ...pagesList()
];

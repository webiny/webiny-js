import document from "./document";
import block from "./block";
import image from "./image";
import text from "./text";
import grid from "./grid";
import cell from "./cell";
import icon from "./icon";
import spacer from "./spacer";
import button from "./button";
import media from "./media";
import social from "./social";
import code from "./code";
import pagesList from "./pagesList";
import imagesList from "./imagesList";

export default [
    document(),
    block(),
    grid(),
    ...cell(),
    ...icon(),
    ...image(),
    ...imagesList(),
    text(),
    spacer(),
    ...button(),
    ...media,
    ...social,
    ...code,
    ...pagesList()
];

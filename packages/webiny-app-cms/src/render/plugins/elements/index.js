// @flow
import document from "./document";
import row from "./row";
import block from "./block";
import column from "./column";
import icon from "./icon";
import image from "./image";
import text from "./text";
import spacer from "./spacer";
import button from "./button";
import embeds from "./embeds";
import pagesList from "./pagesList";

export default [
    document(),
    row(),
    block(),
    column(),
    image(),
    icon(),
    text(),
    spacer(),
    button(),
    ...embeds,
    pagesList()
];

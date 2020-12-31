import document from "./document";
import block from "./block";
import grid from "./grid";
import cell from "./cell";
import icon from "./icon";
import image from "./image";
import paragraph from "./paragraph";
import button from "./button";
import embeds from "./embeds";
import pagesList from "./pagesList";
import imagesList from "./imagesList";

export default [
    document(),
    block(),
    grid(),
    cell(),
    image(),
    icon(),
    paragraph(),
    button(),
    ...embeds,
    ...pagesList(),
    ...imagesList()
];

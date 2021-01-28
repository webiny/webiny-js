/**
 * These plugins are used for rendering of RichTextEditor data.
 * Currently, we only have a renderer to convert RTE data to React elements, but following this example
 * you can implement rendering to plain string or anything else.
 */
import rteToReactRenderer from "./dataRenderer/rteToReactRenderer";
import header from "./dataRenderer/header";
import delimiter from "./dataRenderer/delimiter";
import paragraph from "./dataRenderer/paragraph";
import image from "./dataRenderer/image";
import list from "./dataRenderer/list";
import quote from "./dataRenderer/quote";

export default () => [
    rteToReactRenderer(),
    header(),
    paragraph(),
    image(),
    list(),
    quote(),
    delimiter()
];

import rteDataRendererPlugin from "./dataRenderer";
// blocks
import header from "./dataRenderer/header";
import paragraph from "./dataRenderer/paragraph";
import image from "./dataRenderer/image";
import list from "./dataRenderer/list";
import quote from "./dataRenderer/quote";

export default () => [rteDataRendererPlugin(), header(), paragraph(), image(), list(), quote()];

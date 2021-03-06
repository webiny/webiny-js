import { Plugin } from "@webiny/plugins/types";
import menus from "./menus";
import routes from "./routes";

export default (): Plugin[] => [menus(), routes()];

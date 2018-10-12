// @flow
import { Router } from "webiny-react-router";
export const router = new Router();
export { default as Link } from "./Link";

export {
    RouterComponent as Router,
    renderMiddleware,
    resolveMiddleware
} from "webiny-react-router";

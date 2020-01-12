import { BrowserRouter as RBrowserRouter, StaticRouter as RStaticRouter } from "react-router-dom";
export * from "react-router-dom";

export { Link } from "./Link";

import withRouter from "./withRouter";

export const BrowserRouter = withRouter(RBrowserRouter);
export const StaticRouter = withRouter(RStaticRouter);

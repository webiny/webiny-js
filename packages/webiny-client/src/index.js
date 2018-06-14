import "babel-polyfill";
import App from "./app";
import DocumentUtils from "./utils/document";

const app = new App();
const document = new DocumentUtils();

export { app, document };

export { resolveMiddleware, renderMiddleware } from "webiny-react-router";

export { default as authenticationMiddleware } from "./middleware/authentication";
export { default as Component } from "./utils/Component";
export { default as isElementOfType } from "./utils/isElementOfType";
export { default as elementHasFlag } from "./utils/elementHasFlag";
export { default as LazyLoad } from "./components/LazyLoad";
export { default as Router } from "./components/Router";
export { default as i18n } from "./utils/i18n";

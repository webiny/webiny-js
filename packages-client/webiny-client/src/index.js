import "babel-polyfill";

import App from "./app";
import DocumentUtils from "./utils/document";

const app = new App();
const document = new DocumentUtils();

export { app, document };

export { default as createComponent } from "./utils/createComponent";
export { default as isElementOfType } from "./utils/isElementOfType";
export { default as LazyLoad } from "./components/LazyLoad.cmp";
export { default as ApiComponent } from "./components/ApiComponent.cmp";
export { default as Router } from "./router/Router.cmp";
export { default as Route } from "./router/Route.cmp";
export { default as resolveMiddleware } from "./router/middleware/resolveMiddleware";
export { default as renderMiddleware } from "./router/middleware/renderMiddleware";
export { default as i18n } from "./utils/i18n";
export { default as Uploader } from "./utils/Uploader";

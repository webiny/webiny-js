import "babel-polyfill";

import App from "./app";
import DocumentUtils from "./utils/document";

const app = new App();
const document = new DocumentUtils();

export { app, document };

export {
    RouterComponent as Router,
    resolveMiddleware,
    renderMiddleware
} from "webiny-react-router";
export { default as createComponent } from "./utils/createComponent";
export { default as linkState } from "./utils/linkState";
export { default as isElementOfType } from "./utils/isElementOfType";
export { default as elementHasFlag } from "./utils/elementHasFlag";
export { default as LazyLoad } from "./components/LazyLoad.cmp";
export { default as ApiComponent } from "./components/ApiComponent.cmp";
export { default as i18n } from "./utils/i18n";

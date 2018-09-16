// @flow
import "@babel/polyfill";
import App from "./app";
import DocumentUtils from "./utils/document";

const app = new App();
const document = new DocumentUtils();

export { app, document };

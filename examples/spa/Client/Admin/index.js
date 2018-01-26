import App from "./App";
import { render } from "webiny-client";

render({ app: new App(), root: document.getElementById("root"), module });

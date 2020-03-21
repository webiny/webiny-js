import { createSSR } from "@webiny/app-ssr";
import { App } from "../../site/src/App";

export const ssr = createSSR(App);
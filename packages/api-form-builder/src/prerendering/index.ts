import { prerenderingHandlers } from "@webiny/api-page-builder/prerendering/prerenderingHandlers";
import hooks from "./hooks";

export default () => {
    return [prerenderingHandlers, ...hooks()];
};

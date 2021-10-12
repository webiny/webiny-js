import { prerenderingHandlers } from "./prerenderingHandlers";
import hooks from "./hooks";

export default () => {
    return [prerenderingHandlers, ...hooks()];
};

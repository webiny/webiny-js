import { upperFirst } from "lodash";

export default modelId => {
    return "Headless" + upperFirst(modelId);
};

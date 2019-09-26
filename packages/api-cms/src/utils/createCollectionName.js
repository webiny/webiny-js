import { upperFirst } from "lodash";

export default modelId => {
    return "Cms" + upperFirst(modelId);
};

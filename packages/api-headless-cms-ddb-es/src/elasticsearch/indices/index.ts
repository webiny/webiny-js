import { base } from "./base";
import { japanese } from "./japanese";

export const elasticsearchIndexPlugins = () => {
    return [base, japanese];
};

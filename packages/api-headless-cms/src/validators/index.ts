import { createPatternValidatorPlugins } from "./patternPlugins/index.js";

export const createValidators = () => [createPatternValidatorPlugins()];

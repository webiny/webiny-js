import { escapeRegExp } from "lodash";

const keywords = /token|password|credential|secret|private/i;

// Find ENV variables that need to be hidden
const variables = Object.keys(process.env).filter(
    key => keywords.test(key) && process.env[key].trim()
);

// Construct a regular expression containing the values of ENV variables that need to be hidden
const regexp = new RegExp(variables.map(key => escapeRegExp(process.env[key])).join("|"), "g");

export default output => {
    return output && variables.length > 0 ? output.toString().replace(regexp, "[hidden]") : output;
};

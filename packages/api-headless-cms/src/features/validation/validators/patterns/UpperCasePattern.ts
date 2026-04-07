import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class UpperCasePatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "upperCase",
        regex: `^([A-Z]*)$`,
        flags: ""
    };
}

export const UpperCasePattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: UpperCasePatternImpl,
    dependencies: []
});

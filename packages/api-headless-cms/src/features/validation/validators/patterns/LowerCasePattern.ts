import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class LowerCasePatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "lowerCase",
        regex: `^([a-z]*)$`,
        flags: ""
    };
}

export const LowerCasePattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: LowerCasePatternImpl,
    dependencies: []
});

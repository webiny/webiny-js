import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class UpperCaseSpacePatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "upperCaseSpace",
        regex: `^([A-Z\\s]+)$`,
        flags: ""
    };
}

export const UpperCaseSpacePattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: UpperCaseSpacePatternImpl,
    dependencies: []
});

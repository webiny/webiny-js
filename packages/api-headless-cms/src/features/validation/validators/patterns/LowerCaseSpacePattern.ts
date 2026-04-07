import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class LowerCaseSpacePatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "lowerCaseSpace",
        regex: `^([a-z\\s]+)$`,
        flags: ""
    };
}

export const LowerCaseSpacePattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: LowerCaseSpacePatternImpl,
    dependencies: []
});

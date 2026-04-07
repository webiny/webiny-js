import { CmsModelFieldPatternValidator } from "../../abstractions/CmsModelFieldPatternValidator.js";

class EmailPatternImpl implements CmsModelFieldPatternValidator.Interface {
    public readonly pattern = {
        name: "email",
        regex: `^\\w[\\+\\w.-]*@([\\w-]+\\.)+[\\w-]+$`,
        flags: "i"
    };
}

export const EmailPattern = CmsModelFieldPatternValidator.createImplementation({
    implementation: EmailPatternImpl,
    dependencies: []
});

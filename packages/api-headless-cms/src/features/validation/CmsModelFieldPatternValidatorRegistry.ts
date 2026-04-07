import { CmsModelFieldPatternValidator } from "./abstractions/CmsModelFieldPatternValidator.js";
import { CmsModelFieldPatternValidatorRegistry as RegistryAbstraction } from "./abstractions/CmsModelFieldPatternValidatorRegistry.js";

class CmsModelFieldPatternValidatorRegistryImpl implements RegistryAbstraction.Interface {
    public constructor(
        private readonly validators: CmsModelFieldPatternValidator.Interface[]
    ) {}

    public get(name: string): CmsModelFieldPatternValidator.Interface | undefined {
        return this.validators.find(v => v.pattern.name === name);
    }

    public getAll(): CmsModelFieldPatternValidator.Interface[] {
        return this.validators;
    }
}

export const CmsModelFieldPatternValidatorRegistry = RegistryAbstraction.createImplementation({
    implementation: CmsModelFieldPatternValidatorRegistryImpl,
    dependencies: [[CmsModelFieldPatternValidator, { multiple: true }]]
});

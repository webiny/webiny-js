import { CmsModelFieldValidator } from "./abstractions/CmsModelFieldValidator.js";
import { CmsModelFieldValidatorRegistry as RegistryAbstraction } from "./abstractions/CmsModelFieldValidatorRegistry.js";

class CmsModelFieldValidatorRegistryImpl implements RegistryAbstraction.Interface {
    public constructor(private readonly validators: CmsModelFieldValidator.Interface[]) {}

    public get(name: string): CmsModelFieldValidator.Interface | undefined {
        return this.validators.find(v => {
            return v.name === name;
        });
    }

    public getAll(): CmsModelFieldValidator.Interface[] {
        return this.validators;
    }
}

export const CmsModelFieldValidatorRegistry = RegistryAbstraction.createImplementation({
    implementation: CmsModelFieldValidatorRegistryImpl,
    dependencies: [[CmsModelFieldValidator, { multiple: true }]]
});

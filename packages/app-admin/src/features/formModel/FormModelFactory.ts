import { FormModel } from "./FormModel.js";
import {
    FormModelFactory as Abstraction,
    FieldBuilderRegistry,
    RuleEvaluator,
    type IFormModelFactory,
    type IFormModelConfig,
    type IFormModel,
    type IFieldBuilderRegistry,
    type IRuleEvaluator
} from "./abstractions.js";

class FormModelFactoryImpl implements IFormModelFactory {
    constructor(
        private evaluators: IRuleEvaluator[],
        private registry: IFieldBuilderRegistry
    ) {}

    create<T = Record<string, any>>(config: IFormModelConfig): IFormModel<T> {
        const provided = config.ruleEvaluators ?? [];
        return new FormModel(
            {
                ...config,
                ruleEvaluators: [...this.evaluators, ...provided]
            },
            this.registry
        ) as IFormModel<T>;
    }
}

export const FormModelFactory = Abstraction.createImplementation({
    implementation: FormModelFactoryImpl,
    dependencies: [[RuleEvaluator, { multiple: true }], FieldBuilderRegistry]
});

import { FormModel } from "./FormModel.js";
import {
    FormModelFactory as Abstraction,
    RuleEvaluator,
    type IFormModelFactory,
    type IFormModelConfig,
    type IFormModel,
    type IRuleEvaluator
} from "./abstractions.js";

class FormModelFactoryImpl implements IFormModelFactory {
    constructor(private evaluators: IRuleEvaluator[]) {}

    create<T = Record<string, any>>(config: IFormModelConfig): IFormModel<T> {
        const provided = config.ruleEvaluators ?? [];
        return new FormModel({
            ...config,
            ruleEvaluators: [...this.evaluators, ...provided]
        }) as IFormModel<T>;
    }
}

export const FormModelFactory = Abstraction.createImplementation({
    implementation: FormModelFactoryImpl,
    dependencies: [[RuleEvaluator, { multiple: true }]]
});

import { FormModel } from "./FormModel.js";
import {
    FormModelFactory as Abstraction,
    type IFormModelFactory,
    type IFormModelConfig
} from "./abstractions.js";
import type { IFormModel } from "./abstractions.js";

class FormModelFactoryImpl implements IFormModelFactory {
    create<T = Record<string, any>>(config: IFormModelConfig): IFormModel<T> {
        return new FormModel(config) as IFormModel<T>;
    }
}

export const FormModelFactory = Abstraction.createImplementation({
    implementation: FormModelFactoryImpl,
    dependencies: []
});

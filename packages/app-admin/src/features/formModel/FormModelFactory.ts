import { FormModel } from "./FormModel.js";
import {
    FormModelFactory as Abstraction,
    type IFormModelFactory,
    type IFormModelConfig
} from "./abstractions.js";

class FormModelFactoryImpl implements IFormModelFactory {
    create(config: IFormModelConfig): FormModel {
        return new FormModel(config);
    }
}

export const FormModelFactory = Abstraction.createImplementation({
    implementation: FormModelFactoryImpl,
    dependencies: []
});

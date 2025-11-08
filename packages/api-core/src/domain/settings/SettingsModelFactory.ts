import { createImplementation } from "@webiny/di";
import {
    SettingsModelFactory as FactoryAbstraction,
    SettingsModelBuilder,
    type ISettings
} from "./abstractions.js";
import type { ModelClass } from "~/models/base/ModelBuilder.js";

class SettingsModelFactoryImpl implements FactoryAbstraction.Interface {
    private modelClass: ModelClass<ISettings> | undefined;

    constructor(private modelBuilder: SettingsModelBuilder.Interface) {}

    async create(data: FactoryAbstraction.CreateInput): Promise<ISettings> {
        if (this.modelClass) {
            return this.modelClass.create(data);
        }

        const builder = await this.modelBuilder.buildModel();
        this.modelClass = builder.build();

        return this.modelClass.create(data);
    }
}

export const SettingsModelFactory = createImplementation({
    abstraction: FactoryAbstraction,
    implementation: SettingsModelFactoryImpl,
    dependencies: [SettingsModelBuilder]
});

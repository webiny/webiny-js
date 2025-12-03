import { ModelBuilder as Builder } from "~/models/base/ModelBuilder.js";
import { createImplementation } from "@webiny/di";
import {
    SettingsSchema,
    SettingsModelBuilder as BuilderAbstraction,
    type ISettings
} from "./abstractions.js";

class SettingsModelBuilderImpl implements BuilderAbstraction.Interface {
    async buildModel() {
        return new Builder<ISettings>("Settings", SettingsSchema).withMethods({});
    }
}

export const SettingsModelBuilder = createImplementation({
    abstraction: BuilderAbstraction,
    implementation: SettingsModelBuilderImpl,
    dependencies: []
});

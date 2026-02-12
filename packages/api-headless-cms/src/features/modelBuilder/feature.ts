import { createFeature } from "@webiny/feature/api";
import { FieldBuilderRegistry } from "./fields/FieldBuilderRegistry.js";
import { TextFieldType } from "./fields/TextFieldType.js";
import { LongTextFieldType } from "./fields/LongTextFieldType.js";
import { RichTextFieldType } from "./fields/RichTextFieldType.js";
import { ObjectFieldType } from "./fields/ObjectFieldType.js";
import { RefFieldType } from "./fields/RefFieldType.js";
import { DynamicZoneFieldType } from "./fields/DynamicZoneFieldType.js";
import { NumberFieldType } from "./fields/NumberFieldType.js";
import { BooleanFieldType } from "./fields/BooleanFieldType.js";
import { FileFieldType } from "./fields/FileFieldType.js";
import { DateTimeFieldType } from "./fields/DateTimeFieldType.js";
import { JsonFieldType } from "./fields/JsonFieldType.js";
import { SearchableJsonFieldType } from "./fields/SearchableJsonFieldType.js";
import { LocationFieldType } from "./fields/LocationFieldType.js";
import { FieldBuilderRegistry as FieldsRegistryAbstraction, ModelFactory } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { ModelsProvider as ModelsProviderAbstraction } from "./models/abstractions.js";
import { ModelsProvider } from "./models/ModelsProvider.js";

export const ModelBuilderFeature = createFeature({
    name: "ModelBuilder",
    register(container) {
        // Register core field types
        container.register(TextFieldType);
        container.register(LongTextFieldType);
        container.register(RichTextFieldType);
        container.register(ObjectFieldType);
        container.register(RefFieldType);
        container.register(DynamicZoneFieldType);
        container.register(NumberFieldType);
        container.register(BooleanFieldType);
        container.register(FileFieldType);
        container.register(DateTimeFieldType);
        container.register(JsonFieldType);
        container.register(SearchableJsonFieldType);
        container.register(LocationFieldType);

        // Register field builder registry (will automatically get all FieldType implementations)
        container.register(FieldBuilderRegistry).inSingletonScope();

        // Register unified models provider
        container.registerFactory(ModelsProviderAbstraction, () => {
            let accessControl: AccessControl.Interface | undefined = undefined;
            try {
                // TODO: add `container.resolveOptional`
                accessControl = container.resolve(AccessControl);
            } catch {
                // It's an optional dependency!
            }

            return new ModelsProvider(
                // TODO: introduce a `lazy: true` dependency modifier, which will inject a getter.
                () => container.resolveAll(ModelFactory),
                container.resolve(FieldsRegistryAbstraction),
                accessControl
            );
        });
    }
});

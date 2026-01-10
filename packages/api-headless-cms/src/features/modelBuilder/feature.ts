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
import { PublicModelProvider } from "./models/PublicModelProvider.js";
import { PrivateModelProvider } from "./models/PrivateModelProvider.js";
import { ModelsProvider } from "./models/ModelsProvider.js";
import { LocationFieldType } from "~/features/modelBuilder/fields/LocationFieldType.js";

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
        container.register(LocationFieldType);

        // Register field builder registry (will automatically get all FieldType implementations)
        container.register(FieldBuilderRegistry).inSingletonScope();

        // Register model providers
        container.register(PublicModelProvider).inSingletonScope();
        container.register(PrivateModelProvider).inSingletonScope();
        container.register(ModelsProvider).inSingletonScope();
    }
});

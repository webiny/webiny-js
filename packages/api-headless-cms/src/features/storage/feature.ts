import { createFeature } from "@webiny/feature/api";
import { StorageTransformRegistry } from "./StorageTransformRegistry.js";
import { DateStorageTransform } from "./fields/DateStorageTransform.js";
import { DefaultStorageTransform } from "./fields/DefaultStorageTransform.js";
import { JsonStorageTransform } from "./fields/JsonStorageTransform.js";
import { DynamicZoneStorageTransform } from "./fields/DynamicZoneStorageTransform.js";
import { LongTextStorageTransform } from "./fields/LongTextStorageTransform.js";
import { ObjectStorageTransform } from "./fields/ObjectStorageTransform.js";
import { RichTextStorageTransform } from "./fields/RichTextStorageTransform.js";
import { CompressedTextStorageTransform } from "./fields/CompressedTextStorageTransform.js";
import { EncryptedTextStorageTransform } from "~/features/storage/fields/EncryptedTextStorageTransform.js";

export const StorageFeature = createFeature({
    name: "Cms/StorageFeature",
    register: container => {
        container.register(DateStorageTransform).inSingletonScope();
        container.register(DefaultStorageTransform).inSingletonScope();
        container.register(DynamicZoneStorageTransform).inSingletonScope();
        container.register(JsonStorageTransform).inSingletonScope();
        container.register(LongTextStorageTransform).inSingletonScope();
        container.register(ObjectStorageTransform).inSingletonScope();
        container.register(RichTextStorageTransform).inSingletonScope();
        container.register(CompressedTextStorageTransform).inSingletonScope();
        container.register(EncryptedTextStorageTransform).inSingletonScope();

        // must be last, as it depends on all other transforms being registered first
        container.register(StorageTransformRegistry).inSingletonScope();
    }
});

import { createFeature } from "@webiny/feature/api";
import { StorageTransformRegistry } from "./StorageTransformRegistry.js";
import { DateStorageTransform } from "./fields/DateStorageTransform.js";
import { DefaultStorageTransform } from "./fields/DefaultStorageTransform.js";
import { JsonStorageTransform } from "./fields/JsonStorageTransform.js";
import { DynamicZoneStorageTransform } from "./fields/DynamicZoneStorageTransform.js";
import { LongTextStorageTransform } from "./fields/LongTextStorageTransform.js";
import { ObjectStorageTransform } from "./fields/ObjectStorageTransform.js";
import { RichTextStorageTransform } from "./fields/RichTextStorageTransform.js";

export const StorageFeature = createFeature({
    name: "Cms/StorageFeature",
    register: container => {
        container.register(DateStorageTransform);
        container.register(DefaultStorageTransform);
        container.register(DynamicZoneStorageTransform);
        container.register(JsonStorageTransform);
        container.register(LongTextStorageTransform);
        container.register(ObjectStorageTransform);
        container.register(RichTextStorageTransform);
        container.register(StorageTransformRegistry);
    }
});

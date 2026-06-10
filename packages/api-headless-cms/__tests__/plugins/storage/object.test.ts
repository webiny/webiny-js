import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { StorageFeature } from "~/features/storage/feature.js";
import { StorageTransformRegistry } from "~/features/storage/abstractions/StorageTransformRegistry.js";
import { createObjectMockModel } from "./object/model";
import type { CmsModelField } from "~/types";
import { entryToStorageTransform } from "~/utils/entryStorage";
import { StorageTransform } from "~/features/storage/abstractions/StorageTransform.js";
import { EncryptionFeature } from "@webiny/api-core/features/encryption/feature.js";
import { BuildParamsFeature } from "@webiny/api-core/features/buildParams/feature.js";

class TextWithDefaultTransform implements StorageTransform.Interface {
    public readonly fieldType = "text-with-default";

    public async toStorage({ value, field }: StorageTransform.ToStorageParams) {
        return value || field.settings?.defaultValue || "default value";
    }

    public async fromStorage({ value, field }: StorageTransform.FromStorageParams) {
        return value || field.settings?.defaultValue || "default value";
    }
}

const TextWithDefaultStorageTransform = StorageTransform.createImplementation({
    implementation: TextWithDefaultTransform,
    dependencies: []
});

const diContainer = new Container();
CompressionFeature.register(diContainer);
StorageFeature.register(diContainer);
BuildParamsFeature.register(diContainer);
EncryptionFeature.register(diContainer);
diContainer.register(TextWithDefaultStorageTransform);
const registry = diContainer.resolve(StorageTransformRegistry);
const objectTransform = registry.get("object")!;

const getStorageTransform = (fieldType: string) => {
    return registry.get(fieldType) || registry.get("*")!;
};

describe("object storage transform", () => {
    it("should transform object data to storage", async () => {
        const model = createObjectMockModel();
        const entry: any = {
            values: {
                textWithDefaultFieldId: "",
                titleFieldId: "Some title",
                objectFieldId: {
                    titleFieldId: "Some title",
                    dateFieldId: "2022-09-01",
                    dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"],
                    nestedTextWithDefaultFieldId: ""
                }
            }
        };
        const entryResult = await entryToStorageTransform({ container: diContainer }, model, entry);
        expect(entryResult).toEqual({
            values: {
                textWithDefaultFieldId: "field with default value",
                titleFieldId: "Some title",
                objectFieldId: {
                    titleFieldId: "Some title",
                    dateFieldId: "2022-09-01",
                    dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"],
                    nestedTextWithDefaultFieldId: "nested field with default value"
                }
            }
        });

        const field = model.fields.find(f => f.fieldId === "objectFieldId") as CmsModelField;

        const result = await objectTransform.toStorage({
            value: {
                titleFieldId: "Some title",
                dateFieldId: "2022-09-01",
                dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"],
                nestedTextWithDefaultFieldId: ""
            },
            field,
            model,
            getStorageTransform
        });

        expect(result).toEqual({
            titleFieldId: "Some title",
            dateFieldId: "2022-09-01",
            dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"],
            nestedTextWithDefaultFieldId: "nested field with default value"
        });
    });
});

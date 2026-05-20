import { describe, expect, it } from "vitest";
import { pageModel } from "../../contentAPI/mocks/pageWithDynamicZonesModel";
import type { CmsModel, CmsModelDynamicZoneField } from "~/types";
import { Container } from "@webiny/di";
import { CompressionFeature } from "@webiny/utils/features/compression/feature.js";
import { StorageFeature } from "~/features/storage/feature.js";
import { StorageTransformRegistry } from "~/features/storage/abstractions/StorageTransformRegistry.js";
import { BuildParamsFeature } from "@webiny/api-core/features/buildParams/feature.js";
import { EncryptionFeature } from "@webiny/api-core/features/encryption/feature.js";

const container = new Container();
CompressionFeature.register(container);
StorageFeature.register(container);
BuildParamsFeature.register(container);
EncryptionFeature.register(container);
const registry = container.resolve(StorageTransformRegistry);
const dzTransform = registry.get("dynamicZone")!;

const field = pageModel.fields.find(f => f.id === "peeeyhtc") as CmsModelDynamicZoneField;

const initialValue = [
    {
        text: "Simple Text #1",
        _templateId: "81qiz2v453wx9uque0gox"
    },
    {
        title: "Hero Title #1",
        date: "2024-11-05",
        time: "11:01:01",
        dateTimeWithoutTimezone: new Date("2024-11-05T11:01:01.000Z"),
        dateTimeWithTimezone: "2024-11-05T11:01:01.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        title: "Hero Title #2",
        date: "2024-11-06",
        time: "11:02:02",
        dateTimeWithoutTimezone: new Date("2024-11-06T11:02:02.000Z"),
        dateTimeWithTimezone: "2024-11-06T11:02:02.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        nestedObject: {
            objectTitle: "Objective title #1",
            objectNestedObject: [
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #1",
                    date: "2024-11-07",
                    time: "11:03:03",
                    dateTimeWithoutTimezone: new Date("2024-11-07T11:03:03.000Z"),
                    dateTimeWithTimezone: "2024-11-07T11:03:03.000+01:00"
                },
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #2",
                    date: "2024-11-08",
                    time: "11:04:04",
                    dateTimeWithoutTimezone: new Date("2024-11-08T11:04:04.000Z"),
                    dateTimeWithTimezone: "2024-11-08T11:04:04.000+01:00"
                }
            ]
        },
        dynamicZone: {
            authors: [
                {
                    id: "john-doe#0001",
                    entryId: "john-doe",
                    modelId: "author"
                }
            ],
            _templateId: "0emukbsvmzpozx2lzk883"
        },
        _templateId: "9ht43gurhegkbdfsaafyads"
    },
    {
        author: {
            id: "john-doe#0001",
            entryId: "john-doe",
            modelId: "author"
        },
        authors: [
            {
                id: "john-doe#0001",
                entryId: "john-doe",
                modelId: "author"
            }
        ],
        _templateId: "qi81z2v453wx9uque0gox"
    }
];
const expectedInitialValue = [
    {
        text: "Simple Text #1",
        _templateId: "81qiz2v453wx9uque0gox"
    },
    {
        title: "Hero Title #1",
        date: new Date("2024-11-05"),
        time: "11:01:01",
        dateTimeWithoutTimezone: new Date("2024-11-05T11:01:01.000Z"),
        dateTimeWithTimezone: "2024-11-05T11:01:01.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        title: "Hero Title #2",
        date: new Date("2024-11-06"),
        time: "11:02:02",
        dateTimeWithoutTimezone: new Date("2024-11-06T11:02:02.000Z"),
        dateTimeWithTimezone: "2024-11-06T11:02:02.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        nestedObject: {
            objectTitle: "Objective title #1",
            objectNestedObject: [
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #1",
                    date: new Date("2024-11-07"),
                    time: "11:03:03",
                    dateTimeWithoutTimezone: new Date("2024-11-07T11:03:03.000Z"),
                    dateTimeWithTimezone: "2024-11-07T11:03:03.000+01:00"
                },
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #2",
                    date: new Date("2024-11-08"),
                    time: "11:04:04",
                    dateTimeWithoutTimezone: new Date("2024-11-08T11:04:04.000Z"),
                    dateTimeWithTimezone: "2024-11-08T11:04:04.000+01:00"
                }
            ]
        },
        dynamicZone: {
            authors: [
                {
                    id: "john-doe#0001",
                    entryId: "john-doe",
                    modelId: "author"
                }
            ],
            _templateId: "0emukbsvmzpozx2lzk883"
        },
        _templateId: "9ht43gurhegkbdfsaafyads"
    },
    {
        author: {
            id: "john-doe#0001",
            entryId: "john-doe",
            modelId: "author"
        },
        authors: [
            {
                id: "john-doe#0001",
                entryId: "john-doe",
                modelId: "author"
            }
        ],
        _templateId: "qi81z2v453wx9uque0gox"
    }
];
const expectedToStorageValue = [
    {
        text: {
            compression: "gzip",
            value: expect.any(String)
        },
        _templateId: "81qiz2v453wx9uque0gox"
    },
    {
        title: "Hero Title #1",
        date: "2024-11-05",
        time: "11:01:01",
        dateTimeWithoutTimezone: "2024-11-05T11:01:01.000Z",
        dateTimeWithTimezone: "2024-11-05T11:01:01.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        title: "Hero Title #2",
        date: "2024-11-06",
        time: "11:02:02",
        dateTimeWithoutTimezone: "2024-11-06T11:02:02.000Z",
        dateTimeWithTimezone: "2024-11-06T11:02:02.000+01:00",
        _templateId: "cv2zf965v324ivdc7e1vt"
    },
    {
        emptyDynamicZone: undefined,
        nestedObject: {
            objectTitle: "Objective title #1",
            objectNestedObject: [
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #1",
                    date: "2024-11-07",
                    time: "11:03:03",
                    dateTimeWithoutTimezone: "2024-11-07T11:03:03.000Z",
                    dateTimeWithTimezone: "2024-11-07T11:03:03.000+01:00"
                },
                {
                    nestedObjectNestedTitle: "Content Objecting nested title #2",
                    date: "2024-11-08",
                    time: "11:04:04",
                    dateTimeWithoutTimezone: "2024-11-08T11:04:04.000Z",
                    dateTimeWithTimezone: "2024-11-08T11:04:04.000+01:00"
                }
            ]
        },
        dynamicZone: {
            authors: [
                {
                    id: "john-doe#0001",
                    entryId: "john-doe",
                    modelId: "author"
                }
            ],
            _templateId: "0emukbsvmzpozx2lzk883"
        },
        _templateId: "9ht43gurhegkbdfsaafyads"
    },
    {
        author: {
            id: "john-doe#0001",
            entryId: "john-doe",
            modelId: "author"
        },
        authors: [
            {
                id: "john-doe#0001",
                entryId: "john-doe",
                modelId: "author"
            }
        ],
        _templateId: "qi81z2v453wx9uque0gox"
    }
];

describe("dynamic zone storage transform", () => {
    const getStorageTransform = (fieldType: string) => {
        return registry.get(fieldType) || registry.get("*")!;
    };

    it("should properly transform data to storage", async () => {
        const result = await dzTransform.toStorage({
            field,
            value: initialValue,
            getStorageTransform,
            model: pageModel as CmsModel
        });

        expect(result).toEqual(expectedToStorageValue);
    });

    it("should transform data from storage", async () => {
        const input = await dzTransform.toStorage({
            field,
            value: initialValue,
            getStorageTransform,
            model: pageModel as CmsModel
        });

        const result = await dzTransform.fromStorage({
            field,
            value: input,
            getStorageTransform,
            model: pageModel as CmsModel
        });
        expect(result).toEqual(expectedInitialValue);
    });
});

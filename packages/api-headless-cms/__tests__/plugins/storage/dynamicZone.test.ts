import { describe, expect, it } from "vitest";
import { pageModel } from "../../contentAPI/mocks/pageWithDynamicZonesModel";
import { CmsModel, CmsModelDynamicZoneField } from "~/types";
import { createDynamicZoneStorageTransform } from "~/storage/dynamicZone";
import { createStorageTransform } from "~/storage/index";
import { getStorageTransformFactory } from "~/utils/entryStorage";
import { PluginsContainer } from "@webiny/plugins";

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
        text: "Simple Text #1",
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
    const plugins = new PluginsContainer(createStorageTransform());
    const plugin = createDynamicZoneStorageTransform();
    const getStoragePlugin = getStorageTransformFactory({
        plugins
    });

    it("should properly transform data to storage", async () => {
        const result = await plugin.toStorage({
            field,
            value: initialValue,
            getStoragePlugin,
            model: pageModel as CmsModel,
            plugins
        });

        expect(result).toEqual(expectedToStorageValue);
    });

    it("should transform data from storage", async () => {
        const input = await plugin.toStorage({
            field,
            value: initialValue,
            getStoragePlugin,
            model: pageModel as CmsModel,
            plugins
        });

        const result = await plugin.fromStorage({
            field,
            value: input,
            getStoragePlugin,
            model: pageModel as CmsModel,
            plugins
        });
        expect(result).toEqual(expectedInitialValue);
    });
});

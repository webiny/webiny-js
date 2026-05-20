import { describe, expect, it } from "vitest";
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
const dateTransform = registry.get("datetime")!;

const createParams = ({
    type = "",
    list = false,
    value
}: {
    type?: string;
    list?: boolean;
    value: any;
}) => {
    return {
        field: { storageId: "storageId", settings: { type }, list } as any,
        model: {} as any,
        value,
        getStorageTransform: (fieldType: string) => registry.get(fieldType)!
    };
};

describe("dateStoragePlugin", () => {
    const correctSingleToStorageDateValues = [
        [new Date("2021-03-31T13:34:55.000Z"), "2021-03-31T13:34:55.000Z"],
        [new Date("2021-02-22T01:01:01.003Z"), "2021-02-22T01:01:01.003Z"],
        ["2021-01-01T01:01:52.003Z", "2021-01-01T01:01:52.003Z"]
    ];
    it.each(correctSingleToStorageDateValues)(
        "toStorage should transform single value for storage",
        async (value, expected) => {
            const result = await dateTransform.toStorage(createParams({ type: "date", value }));

            expect(result).toEqual(expected);
        }
    );

    const correctMultipleToStorageDateValues = [
        [
            [new Date("2021-03-31T13:34:55.000Z"), new Date("2021-03-31T14:34:55.000Z")],
            ["2021-03-31T13:34:55.000Z", "2021-03-31T14:34:55.000Z"]
        ],
        [
            [new Date("2021-02-22T01:01:01.003Z"), new Date("2021-02-22T02:01:01.003Z")],
            ["2021-02-22T01:01:01.003Z", "2021-02-22T02:01:01.003Z"]
        ],
        [
            ["2021-01-01T01:01:52.003Z", "2021-01-01T05:01:52.003Z"],
            ["2021-01-01T01:01:52.003Z", "2021-01-01T05:01:52.003Z"]
        ]
    ];
    it.each(correctMultipleToStorageDateValues)(
        "toStorage should transform multiple value for storage",
        async (value, expected) => {
            const result = await dateTransform.toStorage(
                createParams({ type: "date", list: true, value })
            );

            expect(result).toEqual(expected);
        }
    );

    const correctSingleFromStorageDateValues: [string, Date][] = [
        ["2021-03-31T13:34:55.000Z", new Date("2021-03-31T13:34:55.000Z")],
        ["2021-02-22T01:01:01.003Z", new Date("2021-02-22T01:01:01.003Z")],
        ["2021-01-01T01:01:52.003Z", new Date("2021-01-01T01:01:52.003Z")]
    ];

    it.each(correctSingleFromStorageDateValues)(
        "fromStorage should transform single value for output",
        async (value, expected) => {
            const result = await dateTransform.fromStorage(createParams({ type: "date", value }));

            expect(result).toEqual(expected);
        }
    );

    const correctMultipleFromStorageDateValues: [string[], Date[]][] = [
        [
            ["2021-03-31T13:34:55.000Z", "2021-03-31T14:34:55.000Z"],
            [new Date("2021-03-31T13:34:55.000Z"), new Date("2021-03-31T14:34:55.000Z")]
        ],
        [
            ["2021-02-22T01:01:01.003Z", "2021-02-22T02:01:01.003Z"],
            [new Date("2021-02-22T01:01:01.003Z"), new Date("2021-02-22T02:01:01.003Z")]
        ],
        [
            ["2021-01-01T01:01:52.003Z", "2021-01-01T14:01:52.003Z"],
            [new Date("2021-01-01T01:01:52.003Z"), new Date("2021-01-01T14:01:52.003Z")]
        ]
    ];

    it.each(correctMultipleFromStorageDateValues)(
        "fromStorage should transform multiple value for output",
        async (value, expected) => {
            const result = await dateTransform.fromStorage(
                createParams({ type: "date", list: true, value })
            );

            expect(result).toEqual(expected);
        }
    );

    it("should not convert time field value", async () => {
        const value = "11:34:58";
        const result = await dateTransform.toStorage(createParams({ type: "time", value }));
        expect(result).toEqual(value);
    });

    it("should not convert dateTime with tz field value", async () => {
        const value = "2021-04-08T13:34:59+0100";
        const result = await dateTransform.toStorage(
            createParams({ type: "dateTimeWithTimezone", value })
        );
        expect(result).toEqual(value);
    });
});

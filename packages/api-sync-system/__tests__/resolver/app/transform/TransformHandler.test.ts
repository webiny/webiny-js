import { TransformHandler } from "~/resolver/app/transform/TransformHandler.js";
import { createTransformRecordPlugin } from "~/resolver/plugins/TransformRecordPlugin.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import {
    createMockSourceDeployment,
    createMockTargetDeployment
} from "~tests/mocks/deployments.js";
import { createMockTableItemData } from "~tests/mocks/tableItem.js";
import { SemVer } from "semver";
import { DynamoDBTableType } from "~/types.js";
import { createMockPluginsContainer } from "~tests/mocks/plugins.js";

const item1 = createMockTableItemData({
    order: 1
});
const item2 = createMockTableItemData({
    order: 2
});
const item3 = createMockTableItemData({
    order: 3
});
const item4 = createMockTableItemData({
    order: 4
});
const sourceTable = createRegularMockTable();
const sourceDeployment = createMockSourceDeployment({
    version: new SemVer("5.42.0")
});
const targetTable = createRegularMockTable();
const targetDeployment = createMockTargetDeployment({
    version: new SemVer("5.43.0")
});

const plugins = createMockPluginsContainer([
    createTransformRecordPlugin({
        tableType: DynamoDBTableType.REGULAR,
        canTransform: ({ from }) => {
            return from.version.minor === 40;
        },
        async transform() {
            throw new Error("Should never be called.");
        }
    }),
    createTransformRecordPlugin({
        tableType: DynamoDBTableType.REGULAR,
        canTransform: ({ from, to }) => {
            if (from.version.minor !== 42) {
                return false;
            } else if (to.version.minor !== 43) {
                return false;
            }
            return true;
        },
        async transform(_, next) {
            const result = await next();
            return {
                ...result,
                transformed: true
            };
        }
    })
]);

describe("TransformHandler", () => {
    it("should transform the data in correct order", async () => {
        console.info = jest.fn();
        const canTransform = () => {
            return true;
        };
        const handler = new TransformHandler({
            plugins: createMockPluginsContainer([
                createTransformRecordPlugin({
                    tableType: DynamoDBTableType.REGULAR,
                    canTransform,
                    transform: async (_, next) => {
                        return {
                            ...(await next()),
                            first: true,
                            order: 1
                        };
                    }
                }),
                createTransformRecordPlugin({
                    tableType: DynamoDBTableType.REGULAR,
                    canTransform,
                    transform: async (_, next) => {
                        return {
                            ...(await next()),
                            second: true,
                            order: 2
                        };
                    }
                }),
                createTransformRecordPlugin({
                    tableType: DynamoDBTableType.REGULAR,
                    canTransform,
                    transform: async (_, next) => {
                        return {
                            ...(await next()),
                            third: true,
                            order: 3
                        };
                    }
                }),
                createTransformRecordPlugin({
                    tableType: DynamoDBTableType.REGULAR,
                    canTransform,
                    transform: async (_, next) => {
                        return {
                            ...(await next()),
                            fourth: true,
                            order: 4
                        };
                    }
                })
            ])
        });

        const result = await handler.transform({
            sourceTable,
            sourceDeployment,
            targetDeployment,
            targetTable,
            items: [item1]
        });

        expect(result).toEqual({
            items: [
                {
                    ...item1,
                    order: 1,
                    first: true,
                    second: true,
                    third: true,
                    fourth: true
                }
            ]
        });
    });

    it("should transform the data", async () => {
        const handler = new TransformHandler({
            plugins
        });

        const result = await handler.transform({
            sourceTable,
            sourceDeployment,
            targetDeployment,
            targetTable,
            items: [item1, item2, item3, item4]
        });

        expect(result).toEqual({
            items: [
                {
                    ...item1,
                    transformed: true
                },
                {
                    ...item2,
                    transformed: true
                },
                {
                    ...item3,
                    transformed: true
                },
                {
                    ...item4,
                    transformed: true
                }
            ]
        });
    });
});

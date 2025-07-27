import { GenericRecord } from "@webiny/utils";
import { WorkerActionHandler } from "~/worker/handler/WorkerActionHandler.js";
import { createWorkerActionPlugin } from "~/worker/plugins/WorkerActionPlugin.js";

describe("WorkerActionHandler", () => {
    it("should throw error on unsupported action", async () => {
        const handler = new WorkerActionHandler({
            plugins: [
                createWorkerActionPlugin({
                    name: "mock.workerAction",
                    parse() {
                        return null;
                    },
                    handle() {
                        throw new Error("SHOULD NOT REACH THIS POINT!");
                    }
                })
            ]
        });

        try {
            const result = await handler.handle({
                action: "unknown",
                data: {}
            });
            expect(result).toEqual("SHOULD NOT REACH THIS POINT!");
        } catch (ex) {
            expect(ex.message).toBe("Unsupported action on payload.");
            expect(ex.code).toBe("UNSUPPORTED_ACTION");
            expect(ex.data.payload).toEqual({
                action: "unknown",
                data: {}
            });
        }
    });

    it("should handle action", async () => {
        let result: GenericRecord | null = null;
        const handler = new WorkerActionHandler({
            plugins: [
                createWorkerActionPlugin<GenericRecord>({
                    name: "mock.workerAction",
                    parse(input: GenericRecord) {
                        return {
                            ...input,
                            correct: true
                        };
                    },
                    async handle(input) {
                        result = {
                            ...input.data,
                            result: "Handled action."
                        };
                    }
                })
            ]
        });

        await handler.handle({
            action: "mock.workerAction",
            data: {
                someData: "test"
            }
        });

        expect(result).toEqual({
            action: "mock.workerAction",
            data: {
                someData: "test"
            },
            correct: true,
            result: "Handled action."
        });
    });
});

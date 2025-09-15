import { createFileManagerOnPutPlugin } from "~/resolver/recordTypes/fileManager/fileManagerOnPut.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import type { ICopyFile, ICopyFileHandleParams } from "~/resolver/recordTypes/fileManager/types.js";
import { createMockDeployment } from "~tests/mocks/deployments.js";
import { describe, expect, it, vi } from "vitest";

describe("fileManagerOnPut", () => {
    it("should check if the plugin can handle the put command", () => {
        const copyFile: ICopyFile = {
            handle: function () {
                throw new Error("Function not implemented.");
            }
        };

        const plugin = createFileManagerOnPutPlugin({
            copyFile
        });

        const shouldHandle = plugin.canHandle({
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas",
                modelId: "fmFile",
                values: {
                    "text@key": "filepath.jpg"
                }
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        });
        expect(shouldHandle).toBe(true);

        const shouldNotHandle = plugin.canHandle({
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas"
            },
            table: createRegularMockTable(),
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        });

        expect(shouldNotHandle).toBe(false);

        const shouldNotHandleDelete = plugin.canHandle({
            item: {
                SK: "L",
                PK: "T#root#L#en-US#CMS#CME#bafddsafas"
            },
            table: createRegularMockTable(),
            command: "delete",
            target: createMockDeployment(),
            source: createMockDeployment()
        });

        expect(shouldNotHandleDelete).toBe(false);
    });

    it("should handle the put command", async () => {
        const result: Partial<ICopyFileHandleParams> = {};
        const copyFile: ICopyFile = {
            handle: async params => {
                result.key = params.key;
                result.source = params.source;
                result.target = params.target;
                return null;
            }
        };

        const plugin = createFileManagerOnPutPlugin({
            copyFile
        });

        const item = {
            SK: "L",
            PK: "T#root#L#en-US#CMS#CME#bafddsafas",
            modelId: "fmFile",
            values: {
                "text@key": "filepath.jpg"
            }
        };

        const table = createRegularMockTable();
        const target = createMockDeployment();
        const source = createMockDeployment();

        await plugin.handle({
            item,
            table,
            target,
            source
        });

        expect(result.key).toEqual("filepath.jpg");
        expect(result.target).toEqual(target);
        expect(result.source).toEqual(source);
    });

    it("should throw error on copying file", async () => {
        const copyFile: ICopyFile = {
            handle: async () => {
                throw new Error("Copying file failed.");
            }
        };

        const plugin = createFileManagerOnPutPlugin({
            copyFile
        });

        console.error = vi.fn();
        console.log = vi.fn();

        await plugin.handle({
            item: {
                values: {
                    ["text@key"]: "filepath.jpg"
                }
            }
        } as any);

        expect(console.error).toHaveBeenCalledWith(
            "Error while handling file manager onPut plugin."
        );
        expect(console.log).toHaveBeenCalledWith({
            message: "Copying file failed.",
            stack: expect.any(String)
        });
    });
});

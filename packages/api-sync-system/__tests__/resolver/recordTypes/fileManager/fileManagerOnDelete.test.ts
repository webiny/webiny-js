import { createFileManagerOnDeletePlugin } from "~/resolver/recordTypes/fileManager/fileManagerOnDelete.js";
import type {
    IDeleteFile,
    IDeleteFileHandleParams
} from "~/resolver/recordTypes/fileManager/types.js";
import { createRegularMockTable } from "~tests/mocks/table.js";
import { createMockDeployment } from "~tests/mocks/deployments.js";

describe("fileManagerOnDelete", () => {
    it("should check if the plugin can handle the delete command", () => {
        const deleteFile: IDeleteFile = {
            handle: function () {
                throw new Error("Function not implemented.");
            }
        };

        const plugin = createFileManagerOnDeletePlugin({
            deleteFile
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
            command: "delete",
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
            command: "delete",
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
            command: "put",
            target: createMockDeployment(),
            source: createMockDeployment()
        });

        expect(shouldNotHandleDelete).toBe(false);
    });

    it("should handle the delete command", async () => {
        const result: Partial<IDeleteFileHandleParams> = {};
        const deleteFile: IDeleteFile = {
            handle: async params => {
                result.key = params.key;
                result.source = params.source;
                result.target = params.target;
                return null;
            }
        };

        const plugin = createFileManagerOnDeletePlugin({
            deleteFile
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
        const deleteFile: IDeleteFile = {
            handle: async () => {
                throw new Error("Deleting file failed.");
            }
        };

        const plugin = createFileManagerOnDeletePlugin({
            deleteFile
        });

        console.error = jest.fn();
        console.log = jest.fn();

        await plugin.handle({
            item: {
                values: {
                    ["text@key"]: "filepath.jpg"
                }
            }
        } as any);

        expect(console.error).toHaveBeenCalledWith(
            "Error while handling file manager onDelete plugin."
        );
        expect(console.log).toHaveBeenCalledWith({
            message: "Deleting file failed.",
            stack: expect.any(String)
        });
    });
});

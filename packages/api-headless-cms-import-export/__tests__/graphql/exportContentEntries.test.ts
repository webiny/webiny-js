import { useHandler } from "~tests/helpers/useHandler";
import { AUTHOR_MODEL_ID } from "~tests/mocks/model";

describe("get export content entries", () => {
    it("should return an error because the export task is not found", async () => {
        const { getExportContentEntries } = useHandler();

        const [response] = await getExportContentEntries({
            id: "non-existing-id"
        });

        expect(response).toEqual({
            data: {
                getExportContentEntries: {
                    data: null,
                    error: {
                        message: `Export content entries task with id "non-existing-id" not found.`,
                        code: "NOT_FOUND",
                        data: null
                    }
                }
            }
        });
    });

    it("should properly trigger and get the export task", async () => {
        const { createContext, getExportContentEntries } = useHandler();

        const context = await createContext();

        const task = await context.cmsImportExport.startExportContentEntries({
            modelId: AUTHOR_MODEL_ID
        });

        const [response] = await getExportContentEntries({
            id: task.id
        });
        expect(response).toMatchObject({
            data: {
                getExportContentEntries: {
                    data: {
                        id: task.id,
                        modelId: AUTHOR_MODEL_ID,
                        status: "pending"
                    },
                    error: null
                }
            }
        });
    });

    it("should abort the export task", async () => {
        const { createContext, abortExportContentEntries } = useHandler();

        const context = await createContext();

        const task = await context.cmsImportExport.startExportContentEntries({
            modelId: AUTHOR_MODEL_ID
        });

        const [response] = await abortExportContentEntries({
            id: task.id
        });
        expect(response).toEqual({
            data: {
                abortExportContentEntries: {
                    data: {
                        ...task,
                        status: "aborted"
                    },
                    error: null
                }
            }
        });
    });
});

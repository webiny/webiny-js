import useGqlHandler from "./utils/useGqlHandler";
import { fileAData, ids } from "./mocks/files";

describe("file custom dates", () => {
    const { createFile, updateFile } = useGqlHandler();

    it("should create and update file with custom dates", async () => {
        const [createResponse] = await createFile(
            {
                data: {
                    ...fileAData,
                    createdOn: "1995-01-01T00:00:00.000Z",
                    savedOn: "1995-01-01T00:00:00.000Z"
                }
            },
            ["createdOn", "savedOn"]
        );
        expect(createResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileAData,
                            createdOn: "1995-01-01T00:00:00.000Z",
                            savedOn: "1995-01-01T00:00:00.000Z"
                        },
                        error: null
                    }
                }
            }
        });

        const [updateResponse] = await updateFile(
            {
                id: ids.A,
                data: {
                    createdOn: "2005-01-01T00:00:00.000Z",
                    savedOn: "2005-01-01T00:00:00.000Z"
                }
            },
            ["createdOn", "savedOn"]
        );
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileAData,
                            createdOn: "2005-01-01T00:00:00.000Z",
                            savedOn: "2005-01-01T00:00:00.000Z"
                        },
                        error: null
                    }
                }
            }
        });
    });
});

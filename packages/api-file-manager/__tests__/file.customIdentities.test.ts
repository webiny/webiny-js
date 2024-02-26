import useGqlHandler from "./utils/useGqlHandler";
import { fileAData } from "./mocks/files";
import { SecurityIdentity } from "@webiny/api-security/types";

const extraFields = ["createdBy {id displayName type}", "modifiedBy {id displayName type}"];
describe("file custom identities", () => {
    const { createFile, updateFile, identity: defaultIdentity } = useGqlHandler();

    const mockIdentityOne: SecurityIdentity = {
        id: "mock-identity-one",
        displayName: "Mock Identity One",
        type: "mockOne"
    };
    const mockIdentityTwo: SecurityIdentity = {
        id: "mock-identity-two",
        displayName: "Mock Identity Two",
        type: "mockTwo"
    };

    it("should create a file with custom identity", async () => {
        const [createRegularResponse] = await createFile(
            {
                data: {
                    ...fileAData
                }
            },
            extraFields
        );
        expect(createRegularResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileAData,
                            createdBy: defaultIdentity,
                            modifiedBy: null
                        },
                        error: null
                    }
                }
            }
        });

        const [createCustomIdentityResponse] = await createFile(
            {
                data: {
                    ...fileAData,
                    createdBy: mockIdentityOne,
                    modifiedBy: mockIdentityTwo
                }
            },
            extraFields
        );
        expect(createCustomIdentityResponse).toEqual({
            data: {
                fileManager: {
                    createFile: {
                        data: {
                            ...fileAData,
                            createdBy: mockIdentityOne,
                            modifiedBy: mockIdentityTwo
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should update a file with custom identity", async () => {
        const [createResponse] = await createFile(
            {
                data: {
                    ...fileAData
                }
            },
            extraFields
        );

        const id = createResponse.data.fileManager.createFile.data.id;

        const [updateResponse] = await updateFile(
            {
                id,
                data: {
                    createdBy: mockIdentityOne,
                    modifiedBy: mockIdentityTwo
                }
            },
            extraFields
        );
        expect(updateResponse).toEqual({
            data: {
                fileManager: {
                    updateFile: {
                        data: {
                            ...fileAData,
                            createdBy: mockIdentityOne,
                            modifiedBy: mockIdentityTwo
                        },
                        error: null
                    }
                }
            }
        });
    });
});

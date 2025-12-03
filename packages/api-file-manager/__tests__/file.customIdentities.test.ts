import { describe, it, expect } from "vitest";
import useGqlHandler from "./utils/useGqlHandler";
import { fileAData } from "./mocks/files";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

const extraFields = ["createdBy {id displayName type}", "modifiedBy {id displayName type}"];
describe("file custom identities", () => {
    const { createFile, updateFile, identity: defaultIdentity } = useGqlHandler();

    const mockIdentityOne: IdentityData = {
        id: "mock-identity-one",
        displayName: "Mock Identity One",
        type: "mockOne"
    };
    const mockIdentityTwo: IdentityData = {
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

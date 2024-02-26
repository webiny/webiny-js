import { useCategoryManageHandler } from "~tests/testHelpers/useCategoryManageHandler";
import { setupGroupAndModels } from "~tests/testHelpers/setup";
import { SecurityIdentity } from "@webiny/api-security/types";

describe("content entry custom identities", () => {
    const manager = useCategoryManageHandler({
        path: "manage/en-US"
    });

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
    const mockIdentityThree: SecurityIdentity = {
        id: "mock-identity-three",
        displayName: "Mock Identity Three",
        type: "mockThree"
    };

    beforeEach(async () => {
        await setupGroupAndModels({
            manager,
            models: ["category"]
        });
    });

    it("should be possible to create an entry with different identity than the current user", async () => {
        const [createRegularResponse] = await manager.createCategory({
            data: {
                title: "Category Regular Identity",
                slug: "category-regular-identity"
            }
        });
        expect(createRegularResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        revisionCreatedBy: manager.identity,
                        modifiedBy: null,
                        createdBy: manager.identity
                    },
                    error: null
                }
            }
        });

        const [createCustomIdentityResponse] = await manager.createCategory({
            data: {
                title: "Category Custom Identity",
                slug: "category-custom-identity",
                createdBy: mockIdentityOne,
                revisionCreatedBy: mockIdentityTwo,
                modifiedBy: mockIdentityThree
            }
        });

        expect(createCustomIdentityResponse).toMatchObject({
            data: {
                createCategory: {
                    data: {
                        revisionCreatedBy: mockIdentityTwo,
                        modifiedBy: mockIdentityThree,
                        createdBy: mockIdentityOne
                    },
                    error: null
                }
            }
        });
    });

    it("should create a new entry revision with different identity than the current user", async () => {
        const [createRegularResponse] = await manager.createCategory({
            data: {
                title: "Category Regular Identity",
                slug: "category-regular-identity"
            }
        });
        const id = createRegularResponse.data.createCategory.data.id;

        const [createRevisionCustomIdentityResponse] = await manager.createCategoryFrom({
            revision: id,
            data: {
                createdBy: mockIdentityOne,
                revisionCreatedBy: mockIdentityTwo,
                modifiedBy: mockIdentityThree
            }
        });
        expect(createRevisionCustomIdentityResponse).toMatchObject({
            data: {
                createCategoryFrom: {
                    data: {
                        revisionCreatedBy: mockIdentityTwo,
                        modifiedBy: mockIdentityThree,
                        createdBy: mockIdentityOne
                    },
                    error: null
                }
            }
        });
    });

    it("should update an entry with different identity than the current user", async () => {
        const [createRegularResponse] = await manager.createCategory({
            data: {
                title: "Category Regular Identity",
                slug: "category-regular-identity"
            }
        });
        const id = createRegularResponse.data.createCategory.data.id;

        const [updateCustomIdentityResponse] = await manager.updateCategory({
            revision: id,
            data: {
                createdBy: mockIdentityOne,
                revisionCreatedBy: mockIdentityTwo,
                modifiedBy: mockIdentityThree
            }
        });
        expect(updateCustomIdentityResponse).toMatchObject({
            data: {
                updateCategory: {
                    data: {
                        revisionCreatedBy: mockIdentityTwo,
                        modifiedBy: mockIdentityThree,
                        createdBy: mockIdentityOne
                    },
                    error: null
                }
            }
        });
    });
});

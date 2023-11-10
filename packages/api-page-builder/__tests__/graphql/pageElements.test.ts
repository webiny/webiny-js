import useGqlHandler from "./useGqlHandler";
import { defaultIdentity } from "../tenancySecurity";

jest.setTimeout(100000);

describe("PageElements Test", () => {
    const {
        createPageElement,
        deletePageElement,
        listPageElements,
        getPageElement,
        updatePageElement
    } = useGqlHandler();

    test("create, read, update and delete pageElements", async () => {
        // Test creating, getting and updating three pageElements.
        const ids = [];
        for (let i = 0; i < 3; i++) {
            const prefix = `pageElement-${i}-`;
            const data = {
                name: `${prefix}name`,
                type: `element`,
                content: { some: `${prefix}content` }
            };

            const [createPageElementResponse] = await createPageElement({ data });
            expect(createPageElementResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageElement: {
                            data: {
                                ...data,
                                createdBy: defaultIdentity,
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            ids.push(createPageElementResponse.data.pageBuilder.createPageElement.data.id);

            const [getPageElementResponse] = await getPageElement({ id: ids[i] });
            expect(getPageElementResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        getPageElement: {
                            data,
                            error: null
                        }
                    }
                }
            });

            const updateData = {
                name: `${prefix}name-UPDATED`,
                content: { some: `${prefix}content-UPDATED` }
            };

            const [updatePageElementResponse] = await updatePageElement({
                id: ids[i],
                data: updateData
            });
            expect(updatePageElementResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePageElement: {
                            data: {
                                ...updateData,
                                createdBy: defaultIdentity,
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three pageElements.
        const [listPageElementsResponse] = await listPageElements();
        expect(listPageElementsResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageElements: {
                        data: [
                            {
                                content: {
                                    some: "pageElement-0-content-UPDATED"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[0],
                                name: "pageElement-0-name-UPDATED",
                                type: "element"
                            },
                            {
                                content: {
                                    some: "pageElement-1-content-UPDATED"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[1],
                                name: "pageElement-1-name-UPDATED",
                                type: "element"
                            },
                            {
                                content: {
                                    some: "pageElement-2-content-UPDATED"
                                },
                                createdBy: defaultIdentity,
                                createdOn: /^20/,
                                id: ids[2],
                                name: "pageElement-2-name-UPDATED",
                                type: "element"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all pageElements, list should be empty.
        for (let i = 0; i < 3; i++) {
            const [deletePageElementResponse] = await deletePageElement({ id: ids[i] });
            expect(deletePageElementResponse).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePageElement: {
                            data: true,
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero pageElements.
        const [listPageElementsAfterDeleteResponse] = await listPageElements();
        expect(listPageElementsAfterDeleteResponse).toMatchObject({
            data: {
                pageBuilder: {
                    listPageElements: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});

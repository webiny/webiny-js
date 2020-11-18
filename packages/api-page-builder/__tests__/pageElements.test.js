import useGqlHandler from "./useGqlHandler";

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
            let data = {
                name: `${prefix}name`,
                type: `element`,
                category: `${prefix}category`,
                preview: { src: `https://test.com/${prefix}/src.jpg` },
                content: { some: `${prefix}content` }
            };

            let [response] = await createPageElement({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageElement: {
                            data: {
                                ...data,
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            ids.push(response.data.pageBuilder.createPageElement.data.id);

            [response] = await getPageElement({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPageElement: {
                            data,
                            error: null
                        }
                    }
                }
            });

            data = {
                name: `${prefix}name-UPDATED`,
                category: `${prefix}category-UPDATED`,
                preview: { src: `https://test.com/${prefix}/src-UPDATED.jpg` },
                content: { some: `${prefix}content-UPDATED` }
            };

            [response] = await updatePageElement({ id: ids[i], data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePageElement: {
                            data: {
                                ...data,
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show three pageElements.
        let [response] = await listPageElements();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPageElements: {
                        data: [
                            {
                                category: "pageElement-0-category-UPDATED",
                                content: {
                                    some: "pageElement-0-content-UPDATED"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[0],
                                name: "pageElement-0-name-UPDATED",
                                preview: {
                                    src: "https://test.com/pageElement-0-/src-UPDATED.jpg"
                                },
                                type: "element"
                            },
                            {
                                category: "pageElement-1-category-UPDATED",
                                content: {
                                    some: "pageElement-1-content-UPDATED"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[1],
                                name: "pageElement-1-name-UPDATED",
                                preview: {
                                    src: "https://test.com/pageElement-1-/src-UPDATED.jpg"
                                },
                                type: "element"
                            },
                            {
                                category: "pageElement-2-category-UPDATED",
                                content: {
                                    some: "pageElement-2-content-UPDATED"
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[2],
                                name: "pageElement-2-name-UPDATED",
                                preview: {
                                    src: "https://test.com/pageElement-2-/src-UPDATED.jpg"
                                },
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
            let [response] = await deletePageElement({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePageElement: {
                            data: {
                                id: ids[i]
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero pageElements.
        [response] = await listPageElements();
        expect(response).toMatchObject({
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

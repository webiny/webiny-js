import useGqlHandler from "./useGqlHandler";

describe("PageExportTasks Test", () => {
    const {
        createPageExportTask,
        deletePageExportTask,
        listPageExportTasks,
        getPageExportTask,
        updatePageExportTask
    } = useGqlHandler();

    test("create, read, update and delete pageExportTask", async () => {
        // Test creating, getting and updating three pageExportTask.
        const ids = [];
        for (let i = 0; i < 3; i++) {
            let data = {
                status: "pending"
            };

            let [response] = await createPageExportTask({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createPageExportTask: {
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

            ids.push(response.data.pageBuilder.createPageExportTask.data.id);

            [response] = await getPageExportTask({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getPageExportTask: {
                            data,
                            error: null
                        }
                    }
                }
            });

            data = {
                status: "processing",
                data: { url: `https://some-bucket/${i}-content-UPDATED`, key: `some-key-${i}` }
            };

            [response] = await updatePageExportTask({ id: ids[i], data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updatePageExportTask: {
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

        // List should show three pageExportTask.
        let [response] = await listPageExportTasks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPageExportTasks: {
                        data: [
                            {
                                data: {
                                    url: `https://some-bucket/0-content-UPDATED`,
                                    key: `some-key-0`
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[0],
                                status: "processing"
                            },
                            {
                                data: {
                                    url: `https://some-bucket/1-content-UPDATED`,
                                    key: `some-key-1`
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[1],
                                status: "processing"
                            },
                            {
                                data: {
                                    url: `https://some-bucket/2-content-UPDATED`,
                                    key: `some-key-2`
                                },
                                createdBy: {
                                    displayName: "m",
                                    id: "mocked"
                                },
                                createdOn: /^20/,
                                id: ids[2],
                                status: "processing"
                            }
                        ],
                        error: null
                    }
                }
            }
        });

        // After deleting all pageExportTask, list should be empty.
        for (let i = 0; i < 3; i++) {
            const [response] = await deletePageExportTask({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deletePageExportTask: {
                            data: {
                                id: ids[i]
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero pageExportTask.
        [response] = await listPageExportTasks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listPageExportTasks: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});

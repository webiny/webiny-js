import useGqlHandler from "./useGqlHandler";

describe("PageExportTasks Test", () => {
    const {
        createExportPageTask,
        deleteExportPageTask,
        listExportPageTasks,
        getExportPageTask,
        updateExportPageTask
    } = useGqlHandler();

    test("create, read, update and delete ExportPageTask", async () => {
        // Test creating, getting and updating three ExportPageTask.
        const ids = [];
        for (let i = 0; i < 3; i++) {
            let data = {
                status: "pending"
            };

            let [response] = await createExportPageTask({ data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        createExportPageTask: {
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

            ids.push(response.data.pageBuilder.createExportPageTask.data.id);

            [response] = await getExportPageTask({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        getExportPageTask: {
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

            [response] = await updateExportPageTask({ id: ids[i], data });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        updateExportPageTask: {
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

        // List should show three ExportPageTask.
        let [response] = await listExportPageTasks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listExportPageTasks: {
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

        // After deleting all ExportPageTask, list should be empty.
        for (let i = 0; i < 3; i++) {
            const [response] = await deleteExportPageTask({ id: ids[i] });
            expect(response).toMatchObject({
                data: {
                    pageBuilder: {
                        deleteExportPageTask: {
                            data: {
                                id: ids[i]
                            },
                            error: null
                        }
                    }
                }
            });
        }

        // List should show zero ExportPageTask.
        [response] = await listExportPageTasks();
        expect(response).toMatchObject({
            data: {
                pageBuilder: {
                    listExportPageTasks: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });
});

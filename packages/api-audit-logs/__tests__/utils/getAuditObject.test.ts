import { getAuditObject } from "~/utils/getAuditObject";
import { auditLogsApps } from "~/config";

describe("getAuditObject", () => {
    it("should construct audit object from apps", () => {
        const result = getAuditObject(auditLogsApps);

        expect(result).toMatchObject({
            FILE_MANAGER: {
                FILE: {
                    CREATE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE",
                            displayName: "File",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "CREATE",
                            displayName: "Create"
                        }
                    },
                    UPDATE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE",
                            displayName: "File",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "UPDATE",
                            displayName: "Update"
                        }
                    },
                    DELETE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE",
                            displayName: "File",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "DELETE",
                            displayName: "Delete"
                        }
                    }
                },
                FILE_FOLDER: {
                    CREATE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE_FOLDER",
                            displayName: "File folder",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "CREATE",
                            displayName: "Create"
                        }
                    },
                    UPDATE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE_FOLDER",
                            displayName: "File folder",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "UPDATE",
                            displayName: "Update"
                        }
                    },
                    DELETE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "FILE_FOLDER",
                            displayName: "File folder",
                            actions: [
                                {
                                    type: "CREATE",
                                    displayName: "Create"
                                },
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                },
                                {
                                    type: "DELETE",
                                    displayName: "Delete"
                                }
                            ]
                        },
                        action: {
                            type: "DELETE",
                            displayName: "Delete"
                        }
                    }
                },
                SETTINGS: {
                    UPDATE: {
                        app: {
                            app: "FILE_MANAGER",
                            displayName: "File Manager",
                            entities: [
                                {
                                    type: "FILE",
                                    displayName: "File",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "FILE_FOLDER",
                                    displayName: "File folder",
                                    actions: [
                                        {
                                            type: "CREATE",
                                            displayName: "Create"
                                        },
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        },
                                        {
                                            type: "DELETE",
                                            displayName: "Delete"
                                        }
                                    ]
                                },
                                {
                                    type: "SETTINGS",
                                    displayName: "Settings",
                                    actions: [
                                        {
                                            type: "UPDATE",
                                            displayName: "Update"
                                        }
                                    ]
                                }
                            ]
                        },
                        entity: {
                            type: "SETTINGS",
                            displayName: "Settings",
                            actions: [
                                {
                                    type: "UPDATE",
                                    displayName: "Update"
                                }
                            ]
                        },
                        action: {
                            type: "UPDATE",
                            displayName: "Update"
                        }
                    }
                }
            }
        });
    });
});

import useGqlHandler from "./useGqlHandler";

describe("Form Builder Settings Test", () => {
    const {
        createForm,
        deleteForm,
        updateRevision,
        publishRevision,
        unpublishRevision,
        deleteRevision,
        createRevisionFrom,
        saveFormView,
        getForm
    } = useGqlHandler();

    test(`create, read, update, delete and publish "forms"`, async () => {
        // Let's create a form
        let [response] = await createForm({ data: { name: "sign-up" } });

        let formId = response?.data?.forms?.createForm?.data.id;
        let formData = {
            ...response?.data?.forms?.createForm?.data,
            createdOn: /^20/,
            savedOn: /^20/
        };

        expect(response).toMatchObject({
            data: {
                forms: {
                    createForm: {
                        data: formData,
                        error: null
                    }
                }
            }
        });

        // Let's update a form revision
        [response] = await updateRevision({
            id: formId,
            data: {
                layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]],
                triggers: {
                    redirect: {
                        url: "www.webiny.com"
                    }
                }
            }
        });
        expect(response).toMatchObject({
            data: {
                forms: {
                    updateRevision: {
                        data: {
                            ...formData,
                            layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]],
                            triggers: {
                                redirect: {
                                    url: "www.webiny.com"
                                }
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // Let's publish a form
        [response] = await publishRevision({
            id: formId
        });
        expect(response).toMatchObject({
            data: {
                forms: {
                    publishRevision: {
                        data: {
                            ...formData,
                            layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]],
                            triggers: {
                                redirect: {
                                    url: "www.webiny.com"
                                }
                            },
                            published: true,
                            locked: true,
                            publishedOn: /^20/,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        // Let's "unPublish" a form
        [response] = await unpublishRevision({
            id: formId
        });
        expect(response).toMatchObject({
            data: {
                forms: {
                    unpublishRevision: {
                        data: {
                            ...formData,
                            layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]],
                            triggers: {
                                redirect: {
                                    url: "www.webiny.com"
                                }
                            },
                            published: false
                        },
                        error: null
                    }
                }
            }
        });

        // Let's "delete" a form
        [response] = await deleteForm({
            id: formId
        });

        expect(response).toMatchObject({
            data: {
                forms: {
                    deleteForm: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [response] = await createForm({ data: { name: "sign-up" } });
        formId = response?.data?.forms?.createForm?.data.id;
        formData = {
            ...response?.data?.forms?.createForm?.data,
            createdOn: /^20/,
            savedOn: /^20/
        };

        // Let's "delete" a revision
        [response] = await deleteRevision({
            id: formId
        });

        expect(response).toMatchObject({
            data: {
                forms: {
                    deleteRevision: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        [response] = await createForm({ data: { name: "register" } });
        formId = response?.data?.forms?.createForm?.data.id;
        formData = {
            ...response?.data?.forms?.createForm?.data,
            createdOn: /^20/,
            savedOn: /^20/
        };

        // Let's create a new revision
        [response] = await createRevisionFrom({ revision: formId });
        expect(response).toMatchObject({
            data: {
                forms: {
                    createRevisionFrom: {
                        data: {
                            ...formData,
                            id: response?.data?.forms?.createRevisionFrom?.data?.id
                        },
                        error: null
                    }
                }
            }
        });

        // Let's "save form view"
        [response] = await saveFormView({ id: formId });
        expect(response).toMatchObject({
            data: {
                forms: {
                    saveFormView: {
                        error: null
                    }
                }
            }
        });

        // Let's "Get" that updated form
        [response] = await getForm({ id: formId });
        expect(response).toMatchObject({
            data: {
                forms: {
                    getForm: {
                        data: {
                            ...formData,
                            id: formId,
                            stats: {
                                ...formData.stats,
                                views: formData.stats.views + 1
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
});

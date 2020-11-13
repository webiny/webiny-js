import useGqlHandler from "./useGqlHandler";

describe("Form Builder Settings Test", () => {
    const {
        elasticSearch,
        sleep,
        createForm,
        deleteForm,
        updateRevision,
        publishRevision,
        unpublishRevision,
        deleteRevision,
        createRevisionFrom,
        saveFormView,
        getForm,
        getPublishedForm,
        listForms,
        listPublishedForms
    } = useGqlHandler();

    beforeEach(async () => {
        try {
            await elasticSearch.indices.create({ index: "form-builder" });
        } catch (e) {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: "form-builder" });
        } catch (e) {}
    });

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

        [response] = await createForm({ data: { name: "login" } });
        formId = response?.data?.forms?.createForm?.data.id;
        formData = {
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

        // List should be empty.
        while (true) {
            await sleep();
            [response] = await listForms();
            if (response.data.forms.listForms.data.length === 0) {
                break;
            }
        }
        // Should be empty.
        [response] = await listForms();
        expect(response).toMatchObject({
            data: {
                forms: {
                    listForms: {
                        data: [],
                        error: null
                    }
                }
            }
        });
        // Let's create a form again!
        [response] = await createForm({ data: { name: "register" } });
        formId = response?.data?.forms?.createForm?.data.id;
        formData = {
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

        // Let's publish a form
        [response] = await publishRevision({
            id: formId
        });
        formData = {
            ...response?.data?.forms?.publishRevision?.data,
            createdOn: /^20/,
            savedOn: /^20/,
            publishedOn: /^20/
        };
        expect(response).toMatchObject({
            data: {
                forms: {
                    publishRevision: {
                        data: formData,
                        error: null
                    }
                }
            }
        });

        // List should show one form.
        while (true) {
            await sleep();
            [response] = await listForms();
            if (response.data.forms.listForms.data.length === 1) {
                break;
            }
        }

        // Let's create a new revision
        [response] = await createRevisionFrom({ revision: formId });
        formId = response?.data?.forms?.createRevisionFrom?.data?.id;
        formData = {
            ...response?.data?.forms?.createRevisionFrom?.data,
            createdOn: /^20/,
            savedOn: /^20/
        };
        expect(response).toMatchObject({
            data: {
                forms: {
                    createRevisionFrom: {
                        data: {
                            ...formData,
                            id: response?.data?.forms?.createRevisionFrom?.data?.id,
                            version: 2
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

    test(`list forms, list published forms and get published form`, async () => {
        const formIds = [];
        const formDataArray = [];
        // Let's create three forms.
        for (let i = 0; i < 3; i++) {
            // Let's create a form
            const [response] = await createForm({ data: { name: `Test-${i}` } });
            // Save to "id" fro later.
            formIds.push(response?.data?.forms?.createForm?.data.id);

            formDataArray.push({
                ...response?.data?.forms?.createForm?.data,
                createdOn: /^20/,
                savedOn: /^20/
            });

            expect(response).toMatchObject({
                data: {
                    forms: {
                        createForm: {
                            data: formDataArray[i],
                            error: null
                        }
                    }
                }
            });
        }

        // List should not be empty.
        while (true) {
            await sleep();
            const [response] = await listForms();
            if (response.data.forms.listForms.data.length) {
                break;
            }
        }

        // Let's list all the forms
        let [response] = await listForms();

        expect(response).toMatchObject({
            data: {
                forms: {
                    listForms: {
                        data: formDataArray.map(formData => ({
                            ...formData,
                            savedOn: /^20/,
                            createdOn: /^20/
                        })),
                        error: null
                    }
                }
            }
        });

        // Let's publish two forms.
        for (let i = 0; i < 2; i++) {
            // Let's create a form
            const [response] = await publishRevision({ id: formIds[i] });

            formDataArray[i] = {
                ...response?.data?.forms?.publishRevision?.data,
                createdOn: /^20/,
                savedOn: /^20/,
                publishedOn: /^20/
            };

            expect(response).toMatchObject({
                data: {
                    forms: {
                        publishRevision: {
                            data: formDataArray[i],
                            error: null
                        }
                    }
                }
            });
        }

        // List should not be empty.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length) {
                break;
            }
        }

        // Let's list published revisions only.
        [response] = await listPublishedForms({});

        expect(response).toMatchObject({
            data: {
                forms: {
                    listPublishedForms: {
                        data: [formDataArray[0], formDataArray[1]].map(formData => ({
                            ...formData,
                            savedOn: /^20/,
                            createdOn: /^20/
                        })),
                        error: null
                    }
                }
            }
        });

        // Let's list published revisions only.
        [response] = await listPublishedForms({ version: 2 });

        expect(response).toMatchObject({
            data: {
                forms: {
                    listPublishedForms: {
                        data: [],
                        error: null
                    }
                }
            }
        });

        // Let's list published revisions only.
        [response] = await listPublishedForms({ search: "Test-1" });

        expect(response).toMatchObject({
            data: {
                forms: {
                    listPublishedForms: {
                        data: [formDataArray[1]].map(formData => ({
                            ...formData,
                            savedOn: /^20/,
                            createdOn: /^20/
                        })),
                        error: null
                    }
                }
            }
        });

        // Let's list published revisions only.
        [response] = await listPublishedForms({ search: "test" });

        expect(response).toMatchObject({
            data: {
                forms: {
                    listPublishedForms: {
                        data: [formDataArray[0], formDataArray[1]].map(formData => ({
                            ...formData,
                            savedOn: /^20/,
                            createdOn: /^20/
                        })),
                        error: null
                    }
                }
            }
        });

        // Let's get the published revision by parent.
        [response] = await getPublishedForm({ parent: formIds[0] });

        expect(response).toMatchObject({
            data: {
                forms: {
                    getPublishedForm: {
                        data: formDataArray[0],
                        error: null
                    }
                }
            }
        });
    });

    test(`deleting parent form should "delete" all it's revisions`, async () => {
        const formIds = [];
        const formDataArray = [];

        // Let's create a form
        let [response] = await createForm({ data: { name: `Test-A` } });
        // Save to "id" fro later.
        formIds.push(response?.data?.forms?.createForm?.data.id);

        formDataArray.push({
            ...response?.data?.forms?.createForm?.data,
            createdOn: /^20/,
            savedOn: /^20/
        });

        expect(response).toMatchObject({
            data: {
                forms: {
                    createForm: {
                        data: formDataArray[0],
                        error: null
                    }
                }
            }
        });

        // List should not be empty.
        while (true) {
            await sleep();
            const [response] = await listForms();
            if (response.data.forms.listForms.data.length) {
                break;
            }
        }

        [response] = await publishRevision({ id: formIds[0] });
        expect(response).toMatchObject({
            data: {
                forms: {
                    publishRevision: {
                        data: {
                            ...formDataArray[0],
                            publishedOn: /^20/,
                            locked: true,
                            published: true,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        let parentFormId = formIds[0];
        // Let's create two revisions from the original form and publish them.
        for (let i = 0; i < 2; i++) {
            let [response] = await createRevisionFrom({ revision: parentFormId });
            const formData = response?.data?.forms?.createRevisionFrom?.data;

            formIds[i + 1] = response?.data?.forms?.createRevisionFrom?.data?.id;

            expect(response).toMatchObject({
                data: {
                    forms: {
                        createRevisionFrom: {
                            data: {
                                ...formData,
                                createdOn: /^20/,
                                savedOn: /^20/
                            },
                            error: null
                        }
                    }
                }
            });

            [response] = await publishRevision({ id: formIds[i + 1] });
            expect(response).toMatchObject({
                data: {
                    forms: {
                        publishRevision: {
                            data: {
                                ...formData,
                                createdOn: /^20/,
                                savedOn: /^20/,
                                publishedOn: /^20/,
                                locked: true,
                                published: true,
                                status: "published"
                            },
                            error: null
                        }
                    }
                }
            });

            // Update parent id
            parentFormId = formIds[i + 1];
        }

        // List should not be empty.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length === 3) {
                break;
            }
        }

        [response] = await deleteForm({ id: formIds[0] });
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

        // List should be empty.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length === 0) {
                break;
            }
        }
    });
});

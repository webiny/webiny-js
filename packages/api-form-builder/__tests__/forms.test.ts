import fs from "fs";
import path from "path";
import csv from "csvtojson";
import useGqlHandler from "./useGqlHandler";
import { fields, formSubmissionDataA, formSubmissionDataB } from "./mocks/form.mocks";

jest.setTimeout(100000);

describe('Form Builder "Form" Test', () => {
    const {
        install,
        installFileManager,
        createForm,
        deleteForm,
        updateRevision,
        publishRevision,
        unpublishRevision,
        deleteRevision,
        createRevisionFrom,
        saveFormView,
        getForm,
        getFormRevisions,
        listForms,
        getPublishedForm,
        createFormSubmission,
        listFormSubmissions,
        exportFormSubmissions,
        defaultIdentity
    } = useGqlHandler();

    beforeEach(async () => {
        try {
            // Run FB installer
            await install();
            // Run FM installer (we'll need to have FM settings to perform submissions export)
            await installFileManager({ srcPrefix: "https://some.domain.com/files/" });
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });

    test("should create a form and return it in the list of latest forms", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        expect(id.split("#")[1]).toBe("0001");

        expect(create).toMatchObject({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            id: expect.any(String),
                            createdOn: /^20/,
                            savedOn: /^20/,
                            status: "draft",
                            createdBy: defaultIdentity
                        },
                        error: null
                    }
                }
            }
        });

        const [list] = await listForms();
        const { data } = list.data.formBuilder.listForms;
        expect(data.length).toBe(1);
        expect(data[0].id).toEqual(id);
    });

    test("should update form and return new data from storage", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        const newData = {
            name: "New name",
            steps: [
                {
                    title: "Test Step",
                    layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]]
                }
            ]
        };

        const [update] = await updateRevision({ revision: id, data: newData });
        expect(update.data.formBuilder.updateRevision.data).toMatchObject(newData);

        const [get] = await getForm({ revision: id });
        expect(get.data.formBuilder.getForm.data).toMatchObject(newData);

        const [list] = await listForms();
        const { data } = list.data.formBuilder.listForms;
        expect(data.length).toBe(1);
        expect(data[0].name).toEqual(newData.name);
    });

    test(`should correctly add step, rename step and remove step from the form`, async () => {
        const [create] = await createForm({ data: { name: "general-info" } });
        const { id } = create.data.formBuilder.createForm.data;

        const newDataWithSteps = {
            name: "Personal Info",
            steps: [
                {
                    title: "General Info",
                    layout: [["AVoKqyAuH", "QIspyfQRx"]]
                },
                {
                    title: "Web Info",
                    layout: [["fNJag3ZdX"]]
                }
            ]
        };

        const [update] = await updateRevision({ revision: id, data: newDataWithSteps });
        expect(update.data.formBuilder.updateRevision.data).toMatchObject(newDataWithSteps);

        const [get] = await getForm({ revision: id });
        expect(get.data.formBuilder.getForm.data).toMatchObject(newDataWithSteps);

        const newDataWithRenamedStep = {
            name: "Personal Info",
            steps: [
                {
                    title: "General Info",
                    layout: [["AVoKqyAuH", "QIspyfQRx"]]
                },
                {
                    title: "Email",
                    layout: [["fNJag3ZdX"]]
                }
            ]
        };

        const [rename] = await updateRevision({ revision: id, data: newDataWithRenamedStep });
        expect(rename.data.formBuilder.updateRevision.data).toMatchObject(newDataWithRenamedStep);

        const [getFormAfterRename] = await getForm({ revision: id });
        expect(getFormAfterRename.data.formBuilder.getForm.data).toMatchObject(
            newDataWithRenamedStep
        );

        const dataAfterRemovingStep = {
            name: "Personal Info",
            steps: [
                {
                    title: "Email",
                    layout: [["fNJag3ZdX"]]
                }
            ]
        };

        const [remove] = await updateRevision({ revision: id, data: dataAfterRemovingStep });
        expect(remove.data.formBuilder.updateRevision.data).toMatchObject(dataAfterRemovingStep);

        const [getAfterRemovingStep] = await getForm({ revision: id });
        expect(getAfterRemovingStep.data.formBuilder.getForm.data).toMatchObject(
            dataAfterRemovingStep
        );
    });

    test(`should correctly update the "latest" revision when a revision is deleted`, async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Create 2 new revisions
        const [create2] = await createRevisionFrom({ revision: id });
        const { id: id2 } = create2.data.formBuilder.createRevisionFrom.data;

        const [create3] = await createRevisionFrom({ revision: id });
        const { id: id3 } = create3.data.formBuilder.createRevisionFrom.data;

        const [list] = await listForms();
        const { data: data1 } = list.data.formBuilder.listForms;
        expect(data1.length).toBe(1);
        expect(data1[0].id).toEqual(id3);

        // Delete latest revision
        const [deleteRevisionResponse] = await deleteRevision({ revision: id3 });

        expect(deleteRevisionResponse).toEqual({
            data: {
                formBuilder: {
                    deleteRevision: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Make sure revision #2 is now "latest"
        const [list2] = await listForms();
        const { data: data2 } = list2.data.formBuilder.listForms;
        expect(data2.length).toBe(1);
        expect(data2[0].id).toEqual(id2);

        // Delete revision #1; Revision #2 should still be "latest"
        const [deleteRevision1Response] = await deleteRevision({ revision: id });

        expect(deleteRevision1Response).toEqual({
            data: {
                formBuilder: {
                    deleteRevision: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        // Get revisions #2 and verify it's the only remaining revision of this form
        const [get] = await getFormRevisions({ id: id2 });
        const { data: revisions } = get.data.formBuilder.getFormRevisions;
        expect(revisions.length).toBe(1);
        expect(revisions[0].id).toEqual(id2);
        expect(revisions[0].version).toEqual(2);
    });

    test("should delete a form and all of its revisions", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Create 2 new revisions
        await createRevisionFrom({ revision: id });
        await createRevisionFrom({ revision: id });

        // Delete the whole form
        const [result] = await deleteForm({ id });
        expect(result).toEqual({
            data: {
                formBuilder: {
                    deleteForm: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [get] = await getForm({ revision: id });
        expect(get.data.formBuilder.getForm.data).toBe(null);
        const [list] = await listForms();
        expect(list.data.formBuilder.listForms.data.length).toBe(0);
    });

    test("should create revision from specified revision", async () => {
        // Create revision #1
        const [create1] = await createForm({ data: { name: "first" } });
        const data1 = create1.data.formBuilder.createForm.data;

        // Create revision #2 from revision #1
        const [create2] = await createRevisionFrom({ revision: data1.id });
        const data2 = create2.data.formBuilder.createRevisionFrom.data;

        // Update revision #2 name
        const [update2] = await updateRevision({
            revision: data2.id,
            data: { name: "second" }
        });
        const data2updated = update2.data.formBuilder.updateRevision.data;

        // Create revision #3 from revision #1
        const [create3] = await createRevisionFrom({ revision: data1.id });

        // Revision #3 data should match revision #1
        expect(create3.data.formBuilder.createRevisionFrom.data).toMatchObject({
            ...data1,
            id: expect.any(String),
            createdOn: /^20/,
            savedOn: /^20/,
            version: 3
        });

        // Create revision #4 from revision #2
        const [create4] = await createRevisionFrom({ revision: data2.id });

        // Revision #4 data should match revision #2
        expect(create4.data.formBuilder.createRevisionFrom.data).toMatchObject({
            ...data2updated,
            id: expect.any(String),
            createdOn: /^20/,
            savedOn: /^20/,
            version: 4
        });
    });

    test("should publish, add views and unpublish", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Publish revision #1
        await publishRevision({ revision: id });

        // Get the published form
        const [{ data: get }] = await getPublishedForm({ formId: id });
        expect(get.formBuilder.getPublishedForm.data.id).toEqual(id);

        // Create a new revision
        const [create2] = await createRevisionFrom({ revision: id });
        const { id: id2 } = create2.data.formBuilder.createRevisionFrom.data;

        // Latest published form should still be #1
        const [latestPublished] = await getPublishedForm({ formId: id.split("#")[0] });
        expect(latestPublished.data.formBuilder.getPublishedForm.data.id).toEqual(id);

        // Latest revision should be #2
        const [list] = await listForms();
        const { data } = list.data.formBuilder.listForms;
        expect(data.length).toBe(1);
        expect(data[0].id).toEqual(id2);

        // Increment views for #1
        await saveFormView({ revision: id });
        await saveFormView({ revision: id });
        await saveFormView({ revision: id });

        // Verify stats for #1
        const [{ data: get2 }] = await getForm({ revision: id });
        expect(get2.formBuilder.getForm.data.stats.views).toEqual(3);

        // Publish revision #2
        await publishRevision({ revision: id2 });

        // Latest published form should now be #2
        const [latestPublished2] = await getPublishedForm({ formId: id.split("#")[0] });
        expect(latestPublished2.data.formBuilder.getPublishedForm.data.id).toEqual(id2);

        // Increment views for #2
        await saveFormView({ revision: id2 });
        await saveFormView({ revision: id2 });

        // Verify stats for #2
        const [{ data: get3 }] = await getForm({ revision: id2 });
        expect(get3.formBuilder.getForm.data.stats.views).toEqual(2);

        // Verify overall stats
        expect(get3.formBuilder.getForm.data.overallStats.views).toEqual(5);

        // Unpublish #2
        await unpublishRevision({ revision: id2 });

        // Latest published form should now again be #1
        const [latestPublished3] = await getPublishedForm({ formId: id.split("#")[0] });
        expect(latestPublished3.data.formBuilder.getPublishedForm.data.id).toEqual(id);
    });

    test("should create, list and export submissions to file", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Add fields definitions
        await updateRevision({
            revision: id,
            data: { fields, steps: [{ title: "Test Step", layout: [] }] }
        });

        await publishRevision({ revision: id });

        await new Promise(res => setTimeout(res, 2000));

        // Create form submissions
        const [createSubmission1Response] = await createFormSubmission({
            revision: id,
            data: formSubmissionDataA.data,
            meta: formSubmissionDataA.meta
        });

        expect(createSubmission1Response).toMatchObject({
            data: {
                formBuilder: {
                    createFormSubmission: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        await new Promise(res => setTimeout(res, 2000));

        const [createSubmission2Response] = await createFormSubmission({
            revision: id,
            data: formSubmissionDataB.data,
            meta: formSubmissionDataB.meta
        });
        expect(createSubmission2Response).toMatchObject({
            data: {
                formBuilder: {
                    createFormSubmission: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        // Load submissions
        const [submissions] = await listFormSubmissions({ form: id, sort: ["createdOn_ASC"] });
        const list = submissions.data.formBuilder.listFormSubmissions;
        expect(list.data.length).toBe(2);
        expect(list.meta.totalCount).toBe(2);

        // Export submissions
        const [exportCSV] = await exportFormSubmissions({ form: id });
        expect(exportCSV).toMatchObject({
            data: {
                formBuilder: {
                    exportFormSubmissions: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        const { data } = exportCSV.data.formBuilder.exportFormSubmissions;

        expect(data.src.endsWith("form_submissions_export.csv")).toEqual(true);
        expect(data.key.endsWith("form_submissions_export.csv")).toEqual(true);
        expect(data.key.includes("form-submissions")).toEqual(true);

        // Parse CSV and verify there are 2 submissions
        const csvFile = path.join(__dirname, data.key);
        const json = await csv({ output: "csv" }).fromFile(csvFile);
        expect(json.length).toBe(2);
        expect(json[0].sort()).toEqual(
            Object.values({
                ...formSubmissionDataB.data,
                "Date submitted (UTC)": expect.any(String)
            }).sort()
        );
        expect(json[1].sort()).toEqual(
            Object.values({
                ...formSubmissionDataA.data,
                "Date submitted (UTC)": expect.any(String)
            }).sort()
        );
        fs.unlinkSync(csvFile);
    });

    it("should create multiple forms and delete a single one - rest should be visible", async () => {
        /**
         * First we create three forms.
         */
        const [createForm1Response] = await createForm({
            data: {
                name: "form 1"
            }
        });
        expect(createForm1Response).toMatchObject({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            name: "form 1"
                        },
                        error: null
                    }
                }
            }
        });
        const form1 = createForm1Response.data.formBuilder.createForm.data;
        const [createForm2Response] = await createForm({
            data: {
                name: "form 2"
            }
        });
        expect(createForm2Response).toMatchObject({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            name: "form 2"
                        },
                        error: null
                    }
                }
            }
        });
        const form2 = createForm2Response.data.formBuilder.createForm.data;
        const [createForm3Response] = await createForm({
            data: {
                name: "form 3"
            }
        });
        expect(createForm3Response).toMatchObject({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            name: "form 3"
                        },
                        error: null
                    }
                }
            }
        });

        /**
         * Publish form 2 so we can create new revision.
         */
        const [publishForm2Response] = await publishRevision({
            revision: form2.id
        });
        expect(publishForm2Response).toMatchObject({
            data: {
                formBuilder: {
                    publishRevision: {
                        data: {
                            name: "form 2",
                            stats: {
                                submissions: 0,
                                views: 0
                            },
                            status: "published",
                            version: 1
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * We need a new revision of form 2
         */
        const [createRevisionForm2Response] = await createRevisionFrom({
            revision: form2.id
        });
        expect(createRevisionForm2Response).toMatchObject({
            data: {
                formBuilder: {
                    createRevisionFrom: {
                        data: {
                            id: `${form2.formId}#0002`,
                            version: 2,
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });

        const [deleteForm2Response] = await deleteForm({
            id: form2.id
        });
        expect(deleteForm2Response).toEqual({
            data: {
                formBuilder: {
                    deleteForm: {
                        data: true,
                        error: null
                    }
                }
            }
        });
        /**
         * Publish form 1 so we can create new revision.
         */
        const [publishForm1Response] = await publishRevision({
            revision: form1.id
        });
        expect(publishForm1Response).toMatchObject({
            data: {
                formBuilder: {
                    publishRevision: {
                        data: {
                            name: "form 1",
                            stats: {
                                submissions: 0,
                                views: 0
                            },
                            status: "published",
                            version: 1
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Create new revision of the first form.
         */
        const [createRevisionForm1Response] = await createRevisionFrom({
            revision: form1.id
        });
        expect(createRevisionForm1Response).toMatchObject({
            data: {
                formBuilder: {
                    createRevisionFrom: {
                        data: {
                            id: `${form1.formId}#0002`,
                            version: 2,
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Publish it and then create new revision again.
         */
        const [publishForm1ResponseSecond] = await publishRevision({
            revision: `${form1.formId}#0002`
        });
        expect(publishForm1ResponseSecond).toMatchObject({
            data: {
                formBuilder: {
                    publishRevision: {
                        data: {
                            name: "form 1",
                            stats: {
                                submissions: 0,
                                views: 0
                            },
                            status: "published",
                            version: 2
                        },
                        error: null
                    }
                }
            }
        });
        const [createRevisionForm1ResponseSecond] = await createRevisionFrom({
            revision: `${form1.formId}#0002`
        });
        expect(createRevisionForm1ResponseSecond).toMatchObject({
            data: {
                formBuilder: {
                    createRevisionFrom: {
                        data: {
                            id: `${form1.formId}#0003`,
                            version: 3,
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });
        /**
         * Delete the last revision of the form.
         */
        const [deleteRevisionForm1Response] = await deleteRevision({
            revision: `${form1.formId}#0003`
        });
        expect(deleteRevisionForm1Response).toMatchObject({
            data: {
                formBuilder: {
                    deleteRevision: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    it("should properly sort form revisions", async () => {
        const name = "test form";
        const [formResponse] = await createForm({
            data: {
                name
            }
        });
        expect(formResponse).toMatchObject({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            name
                        },
                        error: null
                    }
                }
            }
        });
        const form = formResponse.data.formBuilder.createForm.data;
        const revisions: string[] = [form.id];
        const total = 25;
        /**
         * Now we need to create 20+ revisions
         */
        for (let i = revisions.length; i < total; i++) {
            const prev = revisions[i - 1];
            const [createRevisionResponse] = await createRevisionFrom({
                revision: prev
            });
            expect(createRevisionResponse).toMatchObject({
                data: {
                    formBuilder: {
                        createRevisionFrom: {
                            data: {
                                name,
                                version: i + 1
                            },
                            error: null
                        }
                    }
                }
            });
            revisions.push(createRevisionResponse.data.formBuilder.createRevisionFrom.data.id);
        }
        expect(revisions).toHaveLength(total);

        const [listRevisionsResponse] = await getFormRevisions({
            id: form.id
        });
        expect(listRevisionsResponse).toMatchObject({
            data: {
                formBuilder: {
                    getFormRevisions: {
                        data: revisions.map(rev => {
                            return {
                                id: rev
                            };
                        }),
                        error: null
                    }
                }
            }
        });
    });
});

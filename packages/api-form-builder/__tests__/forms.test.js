import fs from "fs";
import path from "path";
import csv from "csvtojson";
import useGqlHandler from "./useGqlHandler";
import { fields, formSubmissionDataA, formSubmissionDataB } from "./mocks/form.mocks";

jest.setTimeout(60000);

describe('Form Builder "Form" Test', () => {
    const {
        until,
        elasticsearch,
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
        exportFormSubmissions
    } = useGqlHandler();

    const esFbIndex = "root-form-builder";
    const esFmIndex = "root-file-manager";

    beforeEach(async () => {
        try {
            // Run FB installer
            await install();
            // Run FM installer (we'll need to have FM settings to perform submissions export)
            await installFileManager({ srcPrefix: "https://some.domain.com/files/" });
        } catch (e) {
            console.log(e);
        }
    });

    afterEach(async () => {
        try {
            await elasticsearch.indices.delete({ index: esFbIndex });
        } catch (e) {}

        try {
            await elasticsearch.indices.delete({ index: esFmIndex });
        } catch (e) {}
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
                            status: "draft"
                        },
                        error: null
                    }
                }
            }
        });

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data.length > 0
        );

        const [list] = await listForms();
        const { data } = list.data.formBuilder.listForms;
        expect(data.length).toBe(1);
        expect(data[0].id).toEqual(id);
    });

    test("should update form and return new data from DB and Elastic", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        const newData = {
            name: "New name",
            layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]]
        };

        const [update] = await updateRevision({ revision: id, data: newData });
        expect(update.data.formBuilder.updateRevision.data).toMatchObject(newData);

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data[0].name === newData.name
        );

        const [get] = await getForm({ revision: id });
        expect(get.data.formBuilder.getForm.data).toMatchObject(newData);

        const [list] = await listForms();
        const { data } = list.data.formBuilder.listForms;
        expect(data.length).toBe(1);
        expect(data[0].name).toEqual(newData.name);
    });

    test(`should correctly update the "latest" revision when a revision is deleted`, async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data.length > 0
        );

        // Create 2 new revisions
        const [create2] = await createRevisionFrom({ revision: id });
        const { id: id2 } = create2.data.formBuilder.createRevisionFrom.data;

        const [create3] = await createRevisionFrom({ revision: id });
        const { id: id3 } = create3.data.formBuilder.createRevisionFrom.data;

        // Wait until the new revision is indexed in Elastic as "latest"
        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data[0].id === id3
        );

        // Check that the form is inserted into Elastic
        const [list] = await listForms();
        const { data: data1 } = list.data.formBuilder.listForms;
        expect(data1.length).toBe(1);
        expect(data1[0].id).toEqual(id3);

        // Delete latest revision
        await deleteRevision({ revision: id3 });

        // Wait until the previous revision is indexed in Elastic as "latest"
        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data[0].id === id2
        );

        // Make sure revision #2 is now "latest"
        const [list2] = await listForms();
        const { data: data2 } = list2.data.formBuilder.listForms;
        expect(data2.length).toBe(1);
        expect(data2[0].id).toEqual(id2);

        // Delete revision #1; Revision #2 should still be "latest"
        await deleteRevision({ revision: id });

        // Get revisions #2 and verify it's the only remaining revision of this form
        const [get] = await getFormRevisions({ id: id2 });
        const { data: revisions } = get.data.formBuilder.getFormRevisions;
        expect(revisions.length).toBe(1);
        expect(revisions[0].id).toEqual(id2);
        expect(revisions[0].version).toEqual(2);
    });

    test("should delete a form and all of its revisions from DB and Elastic", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Create 2 new revisions
        await createRevisionFrom({ revision: id });
        await createRevisionFrom({ revision: id });

        // Delete the whole form
        await deleteForm({ id });

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data.length === 0
        );

        const [get] = await getForm({ revision: id });
        expect(get.data.formBuilder.getForm.data).toBe(null);
        const [list] = await listForms();
        expect(list.data.formBuilder.listForms.data.length).toBe(0);
    });

    test("should publish, add views and unpublish", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Publish revision #1
        await publishRevision({ revision: id });

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data[0].id === id
        );

        // Get the published form
        const [{ data: get }] = await getPublishedForm({ revision: id });
        expect(get.formBuilder.getPublishedForm.data.id).toEqual(id);

        // Create a new revision
        const [create2] = await createRevisionFrom({ revision: id });
        const { id: id2 } = create2.data.formBuilder.createRevisionFrom.data;

        await until(
            () => listForms().then(([data]) => data),
            ({ data }) => data.formBuilder.listForms.data[0].id === id2
        );

        // Latest published form should still be #1
        const [latestPublished] = await getPublishedForm({ parent: id.split("#")[0] });
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
        const [latestPublished2] = await getPublishedForm({ parent: id.split("#")[0] });
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
        const [latestPublished3] = await getPublishedForm({ parent: id.split("#")[0] });
        expect(latestPublished3.data.formBuilder.getPublishedForm.data.id).toEqual(id);
    });

    test("should create, list and export submissions to file", async () => {
        const [create] = await createForm({ data: { name: "contact-us" } });
        const { id } = create.data.formBuilder.createForm.data;

        // Add fields definitions
        await updateRevision({ revision: id, data: { fields } });

        await publishRevision({ revision: id });

        // Create form submissions
        await createFormSubmission({
            revision: id,
            data: formSubmissionDataA.data,
            meta: formSubmissionDataA.meta
        });

        await createFormSubmission({
            revision: id,
            data: formSubmissionDataB.data,
            meta: formSubmissionDataB.meta
        });

        // Wait until propagated to Elastic...
        await until(
            () => listFormSubmissions({ form: id }).then(([data]) => data),
            ({ data }) => data.formBuilder.listFormSubmissions.data.length === 2
        );

        // Load submissions
        const [submissions] = await listFormSubmissions({ form: id });
        const list = submissions.data.formBuilder.listFormSubmissions;
        expect(list.data.length).toBe(2);
        expect(list.meta.totalCount).toBe(2);

        // Export submissions
        const [exportCSV] = await exportFormSubmissions({ form: id });
        const { data } = exportCSV.data.formBuilder.exportFormSubmissions;
        expect(data).toMatchObject({
            src: `https://some.domain.com/files/form_submissions_export.csv`,
            key: "form_submissions_export.csv"
        });

        // Parse CSV and verify there are 2 submissions
        const csvFile = path.join(__dirname, data.key);
        const json = await csv({ output: "csv" }).fromFile(csvFile);
        expect(json.length).toBe(2);
        expect(json[0].sort()).toEqual(Object.values(formSubmissionDataB.data).sort());
        expect(json[1].sort()).toEqual(Object.values(formSubmissionDataA.data).sort());
        fs.unlinkSync(csvFile);
    });
});

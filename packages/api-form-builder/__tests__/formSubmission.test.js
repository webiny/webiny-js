import useGqlHandler from "./useGqlHandler";
import * as mocks from "./mocks/form.mocks";

describe("Form Submission Test", () => {
    const {
        elasticSearch,
        sleep,
        createFormSubmission,
        updateRevision,
        publishRevision,
        createForm,
        listPublishedForms,
        getFormSubmission,
        listFormSubmission
    } = useGqlHandler();

    let formId, formData;

    beforeAll(async () => {
        try {
            await elasticSearch.indices.create({ index: "form-builder" });
        } catch (e) {}
    });

    afterEach(async () => {
        try {
            await elasticSearch.indices.delete({ index: "form-builder" });
        } catch (e) {}
    });

    beforeEach(async () => {
        // Let's create a form
        let [response] = await createForm({ data: { name: "Test A" } });

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
        // Let's update a form revision
        await updateRevision({
            id: formId,
            data: {
                layout: [["QIspyfQRx", "AVoKqyAuH"], ["fNJag3ZdX"]],
                triggers: {
                    redirect: {
                        url: "www.webiny.com"
                    }
                },
                fields: mocks.fields
            }
        });
        // Let's publish this form so that we can submit it later.
        await publishRevision({
            id: formId
        });

        // List should not be empty.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length) {
                break;
            }
        }
    });

    test(`create, read, export "form submission"`, async () => {
        // Let's create a form revision
        let [response] = await createFormSubmission({
            id: formId,
            ...mocks.formSubmissionDataA
        });
        let formSubmissionIdA = response?.data?.forms.createFormSubmission?.data?.id;

        expect(response).toMatchObject({
            data: {
                forms: {
                    createFormSubmission: {
                        data: mocks.getFormSubmissionData({
                            id: formSubmissionIdA,
                            formData,
                            submissionData: mocks.formSubmissionDataA
                        }),
                        error: null
                    }
                }
            }
        });

        // Let's get form submission by Id.
        [response] = await getFormSubmission({
            id: formSubmissionIdA,
            where: {
                formId: formId
            }
        });

        expect(response).toMatchObject({
            data: {
                forms: {
                    getFormSubmission: {
                        data: mocks.getFormSubmissionData({
                            id: formSubmissionIdA,
                            formData,
                            submissionData: mocks.formSubmissionDataA
                        }),
                        error: null
                    }
                }
            }
        });

        // Let's create another form submission
        [response] = await createFormSubmission({
            id: formId,
            ...mocks.formSubmissionDataB
        });
        let formSubmissionIdB = response?.data?.forms.createFormSubmission?.data?.id;

        expect(response).toMatchObject({
            data: {
                forms: {
                    createFormSubmission: {
                        data: mocks.getFormSubmissionData({
                            id: formSubmissionIdB,
                            formData,
                            submissionData: mocks.formSubmissionDataB
                        }),
                        error: null
                    }
                }
            }
        });

        // Let's get list of form submissions.
        [response] = await listFormSubmission({
            where: {
                form: {
                    parent: formId
                }
            }
        });

        expect(response).toMatchObject({
            data: {
                forms: {
                    listFormSubmissions: {
                        data: [
                            mocks.getFormSubmissionData({
                                id: formSubmissionIdA,
                                formData,
                                submissionData: mocks.formSubmissionDataA
                            }),
                            mocks.getFormSubmissionData({
                                id: formSubmissionIdB,
                                formData,
                                submissionData: mocks.formSubmissionDataB
                            })
                        ],
                        error: null
                    }
                }
            }
        });
    });
});

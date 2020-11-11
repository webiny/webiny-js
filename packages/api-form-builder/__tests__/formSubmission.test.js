import useGqlHandler from "./useGqlHandler";
import * as mocks from "./mocks/form.mocks";

describe("Form Submission Test", () => {
    const {
        createFormSubmission,
        updateRevision,
        publishRevision,
        createForm,
        getFormSubmission,
        listFormSubmission
    } = useGqlHandler();

    let formId, formData;
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
                        data: {
                            createdOn: /^20/,
                            id: formId,
                            layout: [],
                            locked: false,
                            name: "Test A",
                            parent: formId,
                            published: null,
                            publishedOn: null,
                            savedOn: /^20/,
                            status: null,
                            triggers: null,
                            version: 1
                        },
                        error: null
                    }
                }
            }
        });
        // Let's update a form revision
        await updateRevision({
            id: `${formId}#${formData.version}`,
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
            id: `${formId}#${formData.version}`
        });
    });

    test(`create, read, export "form submission"`, async () => {
        // Let's create a form revision
        let [response] = await createFormSubmission({
            id: `${formId}#${formData.version}`,
            ...mocks.formSubmissionDataA
        });
        let formSubmissionIdA = response?.data?.forms.createFormSubmission?.data?.id;
        console.log("formSubmissionIdA: ", formSubmissionIdA);
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
                formId: formId + "#" + formData.version
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
            id: `${formId}#${formData.version}`,
            ...mocks.formSubmissionDataB
        });
        let formSubmissionIdB = response?.data?.forms.createFormSubmission?.data?.id;
        console.log("formSubmissionIdB: ", formSubmissionIdB);
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

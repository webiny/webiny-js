import { SecurityIdentity } from "@webiny/api-security";
import useGqlHandler from "./useGqlHandler";
import * as mocks from "./mocks/form.mocks";

function Mock(prefix) {
    this.name = `${prefix}name`;
}

function MockSubmission(prefix) {
    this.data = {
        firstName: `${prefix}first-name`,
        lastName: `${prefix}last-name`,
        email: `${prefix}email@gmail.com`
    };
    this.meta = {
        ip: "150.129.183.18"
    };
}

const NOT_AUTHORIZED_RESPONSE = operation => ({
    data: {
        forms: {
            [operation]: {
                data: null,
                error: {
                    code: "SECURITY_NOT_AUTHORIZED",
                    data: null,
                    message: "Not authorized!"
                }
            }
        }
    }
});

const identityA = new SecurityIdentity({
    id: "a",
    login: "a",
    type: "test",
    displayName: "Aa"
});

const identityB = new SecurityIdentity({
    id: "b",
    login: "b",
    type: "test",
    displayName: "Bb"
});

const defaultHandler = useGqlHandler({
    permissions: [{ name: "content.i18n" }, { name: "forms.*" }],
    identity: identityA
});

beforeEach(async () => {
    try {
        await defaultHandler.elasticSearch.indices.create({ index: "form-builder" });
    } catch (e) {}
});

afterEach(async () => {
    try {
        await defaultHandler.elasticSearch.indices.delete({ index: "form-builder" });
    } catch (e) {}
});

describe("Forms Security Test", () => {
    test(`"listFormSubmissions" only returns entries to which the identity has access to`, async () => {
        const {
            sleep,
            createForm,
            updateRevision,
            listForms,
            publishRevision,
            listPublishedForms,
            createFormSubmission
        } = defaultHandler;
        const mockA = new Mock("get-form-submission-A-");
        const [createFormResponseA] = await createForm({ data: mockA });
        const formIdA = createFormResponseA.data.forms.createForm.data.id;
        const formDataA = createFormResponseA.data.forms.createForm.data;
        // Let's add some fields.
        await updateRevision({
            id: formIdA,
            data: {
                fields: mocks.fields
            }
        });

        const defaultHandlerWithIdentityB = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "forms.*" }],
            identity: identityB
        });

        const mockB = new Mock("get-form-submission-B-");
        const [createFormResponseB] = await defaultHandlerWithIdentityB.createForm({ data: mockB });
        const formIdB = createFormResponseB.data.forms.createForm.data.id;
        const formDataB = createFormResponseB.data.forms.createForm.data;
        // Let's add some fields.
        await updateRevision({
            id: formIdB,
            data: {
                fields: mocks.fields
            }
        });

        // List should not be empty.
        // Wait for the "Elasticsearch" to finish indexing.
        while (true) {
            await sleep();
            const [response] = await listForms();
            if (response.data.forms.listForms.data.length === 2) {
                break;
            }
        }
        // Let's also publish this form.
        await publishRevision({ id: formIdA });
        await publishRevision({ id: formIdB });

        // List should not be empty.
        // Wait for the "Elasticsearch" to finish indexing.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length === 2) {
                break;
            }
        }
        // Let's right the real test.
        const submissionMockData = [];
        const formSubmissionIds = [];
        for (let i = 0; i < 2; i++) {
            // add mock data
            submissionMockData.push(new MockSubmission(`list-form-submissions-${i}-`));
            const [createFormSubmissionResponse] = await createFormSubmission({
                id: formIdA,
                ...submissionMockData[i]
            });
            // Save submission "id".
            formSubmissionIds.push(
                createFormSubmissionResponse.data.forms.createFormSubmission.data.id
            );
        }

        const identityBHandler = useGqlHandler({ identity: identityB });
        for (let i = 2; i < 4; i++) {
            // add mock data
            submissionMockData.push(new MockSubmission(`list-form-submissions-${i}-`));
            const [createFormSubmissionResponse] = await identityBHandler.createFormSubmission({
                id: formIdB,
                ...submissionMockData[i]
            });
            // Save submission "id".
            formSubmissionIds.push(
                createFormSubmissionResponse.data.forms.createFormSubmission.data.id
            );
        }

        const insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "forms.submissions", rwd: "wd" }], identityA],
            [[{ name: "forms.submissions", rwd: "d" }], identityA],
            [[{ name: "forms.submissions", rwd: "w" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { listFormSubmission } = useGqlHandler({ permissions, identity });
            let [response] = await listFormSubmission();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("listFormSubmissions"));
        }

        const sufficientPermissionsAll = [
            [[{ name: "content.i18n" }, { name: "forms.submissions" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            let [permissions, identity] = sufficientPermissionsAll[i];
            const { listFormSubmission } = useGqlHandler({ permissions, identity });

            let [response] = await listFormSubmission({
                where: {
                    form: {
                        parent: formIdA
                    }
                }
            });
            expect(response).toMatchObject({
                data: {
                    forms: {
                        listFormSubmissions: {
                            data: formSubmissionIds.slice(0, 2).map((id, index) =>
                                mocks.getFormSubmissionData({
                                    submissionData: submissionMockData[index],
                                    id,
                                    formData: formDataA
                                })
                            ),
                            error: null
                        }
                    }
                }
            });
        }

        let identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "forms.submissions", own: true }],
            identity: identityA
        });

        let [response] = await identityAHandler.listFormSubmission({
            where: {
                form: {
                    parent: formIdA
                }
            }
        });
        expect(response).toMatchObject({
            data: {
                forms: {
                    listFormSubmissions: {
                        data: formSubmissionIds.slice(0, 2).map((id, index) =>
                            mocks.getFormSubmissionData({
                                submissionData: submissionMockData[index],
                                id,
                                formData: formDataA
                            })
                        ),
                        error: null
                    }
                }
            }
        });

        identityAHandler = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "forms.submissions", own: true }],
            identity: identityB
        });

        [response] = await identityAHandler.listFormSubmission({
            where: {
                form: {
                    parent: formIdB
                }
            }
        });
        expect(response).toMatchObject({
            data: {
                forms: {
                    listFormSubmissions: {
                        data: [
                            mocks.getFormSubmissionData({
                                submissionData: submissionMockData[2],
                                id: formSubmissionIds[2],
                                formData: formDataB
                            }),
                            mocks.getFormSubmissionData({
                                submissionData: submissionMockData[3],
                                id: formSubmissionIds[3],
                                formData: formDataB
                            })
                        ],
                        error: null
                    }
                }
            }
        });
    });

    test(`allow "getFormSubmission" if identity has sufficient permissions`, async () => {
        const {
            sleep,
            createForm,
            updateRevision,
            listForms,
            publishRevision,
            listPublishedForms,
            createFormSubmission
        } = defaultHandler;
        const mock = new Mock("get-form-submission-");

        const [createFormResponse] = await createForm({ data: mock });
        const formId = createFormResponse.data.forms.createForm.data.id;
        const formData = createFormResponse.data.forms.createForm.data;
        // Let's add some fields.
        await updateRevision({
            id: formId,
            data: {
                fields: mocks.fields
            }
        });

        // List should not be empty.
        // Wait for the "Elasticsearch" to finish indexing.
        while (true) {
            await sleep();
            const [response] = await listForms();
            if (response.data.forms.listForms.data.length) {
                break;
            }
        }
        // Let's also publish this form.
        await publishRevision({ id: formId });

        // List should not be empty.
        // Wait for the "Elasticsearch" to finish indexing.
        while (true) {
            await sleep();
            const [response] = await listPublishedForms();
            if (response.data.forms.listPublishedForms.data.length) {
                break;
            }
        }

        // Let's run the real test
        const submissionMock = new MockSubmission("get-submission");
        const [createFormSubmissionResponse] = await createFormSubmission({
            id: formId,
            ...submissionMock
        });
        const submissionId = createFormSubmissionResponse.data.forms.createFormSubmission.data.id;

        let insufficientPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "forms.submissions", rwd: "w" }], identityA],
            [[{ name: "forms.submissions", rwd: "wd" }], identityA],
            [[{ name: "forms.submissions", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            let [permissions, identity] = insufficientPermissions[i];
            const { getFormSubmission } = useGqlHandler({ permissions, identity });
            let [response] = await getFormSubmission({
                id: submissionId,
                where: {
                    formId: formId
                }
            });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getFormSubmission"));
        }

        let sufficientPermissions = [
            [[{ name: "content.i18n" }, { name: "forms.submissions" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "forms.submissions", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            let [permissions, identity] = sufficientPermissions[i];
            const { getFormSubmission } = useGqlHandler({ permissions, identity });
            let [response] = await getFormSubmission({
                id: submissionId,
                where: {
                    formId: formId
                }
            });
            expect(response).toMatchObject({
                data: {
                    forms: {
                        getFormSubmission: {
                            data: mocks.getFormSubmissionData({
                                id: submissionId,
                                formData,
                                submissionData: submissionMock
                            }),
                            error: null
                        }
                    }
                }
            });
        }
    });
});

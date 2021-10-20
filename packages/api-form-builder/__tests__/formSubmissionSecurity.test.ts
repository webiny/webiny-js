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
        formBuilder: {
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

describe("Forms Submission Security Test", () => {
    const handlerA = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "fb.*" }],
        identity: identityA
    });

    beforeEach(async () => {
        try {
            await handlerA.install();
        } catch (ex) {
            console.log(ex.message);
        }
    });

    test(`"listFormSubmissions" only returns entries to which the identity has access to`, async () => {
        // Create form as Identity A
        const [createFormA] = await handlerA.createForm({ data: new Mock("A1-") });

        /**
         * Make sure form is created
         */
        expect(createFormA).toEqual({
            data: {
                formBuilder: {
                    createForm: {
                        data: {
                            id: expect.any(String),
                            formId: expect.any(String),
                            version: 1,
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            layout: [],
                            fields: [],
                            locked: false,
                            published: false,
                            publishedOn: null,
                            name: "A1-name",
                            overallStats: {
                                conversionRate: 0,
                                submissions: 0,
                                views: 0
                            },
                            stats: {
                                submissions: 0,
                                views: 0
                            },
                            status: "draft",
                            triggers: null,
                            settings: {
                                reCaptcha: {
                                    settings: {
                                        enabled: null,
                                        secretKey: null,
                                        siteKey: null
                                    }
                                }
                            },
                            ownedBy: {
                                id: identityA.id,
                                displayName: identityA.displayName,
                                type: identityA.type
                            },
                            createdBy: {
                                id: identityA.id,
                                displayName: identityA.displayName,
                                type: identityA.type
                            }
                        },
                        error: null
                    }
                }
            }
        });
        const { data: formA } = createFormA.data.formBuilder.createForm;

        // Let's add some fields.
        const [updateFormRevisionResponse] = await handlerA.updateRevision({
            revision: formA.id,
            data: {
                fields: mocks.fields
            }
        });
        expect(updateFormRevisionResponse).toEqual({
            data: {
                formBuilder: {
                    updateRevision: {
                        data: {
                            ...formA,
                            savedOn: expect.stringMatching(/^20/),
                            fields: expect.any(Array)
                        },

                        error: null
                    }
                }
            }
        });

        const [publishFormRevisionResponse] = await handlerA.publishRevision({
            revision: formA.id
        });
        expect(publishFormRevisionResponse).toEqual({
            data: {
                formBuilder: {
                    publishRevision: {
                        data: {
                            ...formA,
                            savedOn: expect.stringMatching(/^20/),
                            fields: expect.any(Array),
                            status: "published",
                            published: true,
                            publishedOn: expect.stringMatching(/^20/),
                            locked: true
                        },
                        error: null
                    }
                }
            }
        });

        // Create form as Identity B (this guy can only access his own forms)
        const handlerB = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "fb.*", own: true }],
            identity: identityB
        });

        const [createFormB] = await handlerB.createForm({ data: new Mock("B1-") });
        const { data: formB } = createFormB.data.formBuilder.createForm;

        // Let's add some fields.
        await handlerB.updateRevision({
            revision: formB.id,
            data: {
                fields: mocks.fields
            }
        });

        await handlerB.publishRevision({ revision: formB.id });

        // Create submissions
        // NOTE: response variables are unused but left here for debugging purposes!

        for (let a = 1; a <= 3; a++) {
            const [createFormSubmissionResponse] = await handlerA.createFormSubmission({
                revision: formA.id,
                ...new MockSubmission(`A${a}-`)
            });

            expect(createFormSubmissionResponse).toEqual({
                data: {
                    formBuilder: {
                        createFormSubmission: {
                            data: expect.any(Object),
                            error: null
                        }
                    }
                }
            });
        }

        for (let b = 1; b <= 2; b++) {
            const [createFormSubmissionResponse] = await handlerB.createFormSubmission({
                revision: formB.id,
                ...new MockSubmission(`B${b}-`)
            });

            expect(createFormSubmissionResponse).toEqual({
                data: {
                    formBuilder: {
                        createFormSubmission: {
                            data: expect.any(Object),
                            error: null
                        }
                    }
                }
            });
        }

        /*
        await handlerA.createFormSubmission({
            revision: formA.id,
            ...new MockSubmission("A1-")
        });

        await handlerA.createFormSubmission({
            revision: formA.id,
            ...new MockSubmission("A2-")
        });

        await handlerA.createFormSubmission({
            revision: formA.id,
            ...new MockSubmission("A3-")
        });

        await handlerB.createFormSubmission({
            revision: formB.id,
            ...new MockSubmission("B1-")
        });

        await handlerB.createFormSubmission({
            revision: formB.id,
            ...new MockSubmission("B2-")
        });
        */

        await handlerA.until(
            () => handlerA.listFormSubmissions({ form: formA.id }).then(([data]) => data),
            ({ data }) => data.formBuilder.listFormSubmissions.data.length === 3,
            {
                name: "list form A submissions",
                wait: 500,
                tries: 20
            }
        );
        await handlerA.until(
            () => handlerA.listFormSubmissions({ form: formB.id }).then(([data]) => data),
            ({ data }) => data.formBuilder.listFormSubmissions.data.length === 2,
            {
                name: "list form B submissions",
                wait: 500,
                tries: 20
            }
        );

        // Identity A should have access to submissions in Form A
        const [AlistA1] = await handlerA.listFormSubmissions({ form: formA.id });
        expect(AlistA1.data.formBuilder.listFormSubmissions.data.length).toBe(3);

        // Identity A should also have access to submissions in Form B
        const [AlistB1] = await handlerA.listFormSubmissions({ form: formB.id });
        expect(AlistB1.data.formBuilder.listFormSubmissions.data.length).toBe(2);

        // Identity B should NOT have access to submissions in Form A
        const [BlistA1] = await handlerB.listFormSubmissions({ form: formA.id });
        expect(BlistA1).toMatchObject(NOT_AUTHORIZED_RESPONSE("listFormSubmissions"));

        // Identity B should have access to submissions in Form B
        const [BlistB1] = await handlerB.listFormSubmissions({ form: formB.id });
        expect(BlistB1.data.formBuilder.listFormSubmissions.data.length).toBe(2);

        // Identity should NOT have access to submissions in its own form,
        // if `submissions: "no"` is set on the permission.
        const handlerC = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "fb.*", submissions: "no" }],
            identity: identityA
        });

        const [ClistA1] = await handlerC.listFormSubmissions({ form: formA.id });
        expect(ClistA1).toMatchObject(NOT_AUTHORIZED_RESPONSE("listFormSubmissions"));
    });
});

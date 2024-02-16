import useGqlHandler from "./useGqlHandler";
import { SecurityIdentity } from "@webiny/api-security/types";
import { IdentityPermissions } from "./types";

class Mock {
    public readonly name: string;
    constructor(prefix = "") {
        this.name = `${prefix}name`;
    }
}

class MockResponse {
    public readonly id: string;
    public readonly name: string;
    public readonly createdOn: RegExp;
    public readonly savedOn: RegExp;
    public readonly publishedOn: RegExp | null;
    public readonly status: "published" | "draft";
    public readonly version: number;

    public constructor({ prefix, id }: { prefix: string; id: string }) {
        this.id = id;
        this.name = `${prefix}name`;
        this.createdOn = /^20/;
        this.savedOn = /^20/;
        this.publishedOn = null;
        this.status = "draft";
        this.version = 1;
    }
}

const NOT_AUTHORIZED_RESPONSE = (operation: string) => ({
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

const identityA: SecurityIdentity = {
    id: "a",
    type: "test",
    displayName: "Aa"
};

const identityB: SecurityIdentity = {
    id: "b",
    type: "test",
    displayName: "Bb"
};

describe("Forms Security Test", () => {
    const defaultHandler = useGqlHandler({
        permissions: [{ name: "content.i18n" }, { name: "fb.*" }],
        identity: identityA
    });

    test(`"listForms" only returns entries to which the identity has access to`, async () => {
        const { createForm } = defaultHandler;

        const [createA1] = await createForm({ data: new Mock("list-forms-1-") });

        const { id: formA1Id } = createA1.data.formBuilder.createForm.data;

        const [createA2] = await createForm({ data: new Mock("list-forms-2-") });
        const { id: formA2Id } = createA2.data.formBuilder.createForm.data;

        const identityBHandler = useGqlHandler({ identity: identityB });

        const [createB1] = await identityBHandler.createForm({ data: new Mock("list-forms-3-") });
        const { id: formB1Id } = createB1.data.formBuilder.createForm.data;

        const [createB2] = await identityBHandler.createForm({ data: new Mock("list-forms-4-") });
        const { id: formB2Id } = createB2.data.formBuilder.createForm.data;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fb.form", rwd: "wd" }], identityA],
            [[{ name: "fb.form", rwd: "d" }], identityA],
            [[{ name: "fb.form", rwd: "w" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { listForms } = useGqlHandler({ permissions, identity });
            const [response] = await listForms();
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("listForms"));
        }

        const sufficientPermissionsAll: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.*" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissionsAll.length; i++) {
            const [permissions, identity] = sufficientPermissionsAll[i];
            const { listForms } = useGqlHandler({ permissions, identity });

            const [response] = await listForms();
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        listForms: {
                            data: [
                                new MockResponse({ prefix: "list-forms-4-", id: formB2Id }),
                                new MockResponse({ prefix: "list-forms-3-", id: formB1Id }),
                                new MockResponse({ prefix: "list-forms-2-", id: formA2Id }),
                                new MockResponse({ prefix: "list-forms-1-", id: formA1Id })
                            ],
                            error: null
                        }
                    }
                }
            });
        }

        const handlerA = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "fb.form", own: true }],
            identity: identityA
        });

        const [listA] = await handlerA.listForms();

        expect(listA).toMatchObject({
            data: {
                formBuilder: {
                    listForms: {
                        data: [
                            new MockResponse({ prefix: "list-forms-2-", id: formA2Id }),
                            new MockResponse({ prefix: "list-forms-1-", id: formA1Id })
                        ],
                        error: null
                    }
                }
            }
        });

        const handlerB = useGqlHandler({
            permissions: [{ name: "content.i18n" }, { name: "fb.form", own: true }],
            identity: identityB
        });

        const [listB] = await handlerB.listForms();

        expect(listB).toMatchObject({
            data: {
                formBuilder: {
                    listForms: {
                        data: [
                            new MockResponse({ prefix: "list-forms-4-", id: formB2Id }),
                            new MockResponse({ prefix: "list-forms-3-", id: formB1Id })
                        ],
                        error: null
                    }
                }
            }
        });
    });

    const insufficientPermissions: IdentityPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "fb.form", own: false, rwd: "r" }], identityA],
        [[{ name: "fb.form", own: false, rwd: "rd" }], identityA]
    ];

    test.each(insufficientPermissions)(
        `forbid "createForm" with %j`,
        async (permissions, identity) => {
            const { createForm } = useGqlHandler({ permissions, identity });
            const [response] = await createForm({ data: new Mock() });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("createForm"));
        }
    );

    const sufficientPermissions: IdentityPermissions = [
        [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", rwd: "w" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rw" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA]
    ];

    test.each(sufficientPermissions)(
        `allow "createForm" with %j`,
        async (permissions, identity) => {
            const { createForm } = useGqlHandler({ permissions, identity });

            const data = new Mock(`form-create-`);
            const [response] = await createForm({ data });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        createForm: {
                            data: {
                                ...new MockResponse({
                                    prefix: `form-create-`,
                                    id: expect.any(String)
                                })
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );

    test(`allow "updateForm" if identity has sufficient permissions`, async () => {
        const { createForm } = defaultHandler;
        const mock = new Mock("update-form-");

        const [createFormResponse] = await createForm({ data: mock });
        const formId = createFormResponse.data.formBuilder.createForm.data.id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fb.form", rwd: "r" }], identityA],
            [[{ name: "fb.form", rwd: "rd" }], identityA],
            [[{ name: "fb.form", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { updateRevision } = useGqlHandler({ permissions, identity });
            const mock = new Mock(`new-updated-form-`);
            const [response] = await updateRevision({ revision: formId, data: mock });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("updateRevision"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { updateRevision } = useGqlHandler({ permissions, identity });
            const mock = new Mock(`new-updated-form-`);
            const [response] = await updateRevision({
                revision: formId,
                data: {
                    ...mock,
                    steps: [
                        {
                            title: "Step 1",
                            layout: []
                        }
                    ]
                }
            });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        updateRevision: {
                            data: {
                                ...new MockResponse({ prefix: `new-updated-form-`, id: formId }),
                                steps: [
                                    {
                                        title: "Step 1",
                                        layout: []
                                    }
                                ]
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "getForm" if identity has sufficient permissions`, async () => {
        const { createForm } = defaultHandler;
        const mock = new Mock("get-form-");

        const [createFormResponse] = await createForm({ data: mock });
        const formId = createFormResponse.data.formBuilder.createForm.data.id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fb.form", rwd: "w" }], identityA],
            [[{ name: "fb.form", rwd: "wd" }], identityA],
            [[{ name: "fb.form", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { getForm } = useGqlHandler({ permissions, identity });
            const [response] = await getForm({ revision: formId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("getForm"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "r" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { getForm } = useGqlHandler({ permissions, identity });
            const [response] = await getForm({ revision: formId });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        getForm: {
                            data: new MockResponse({ prefix: `get-form-`, id: formId }),
                            error: null
                        }
                    }
                }
            });
        }
    });

    test(`allow "deleteForm" if identity has sufficient permissions`, async () => {
        const { createForm } = defaultHandler;
        const mock = new Mock("delete-form-");

        let [createFormResponse] = await createForm({ data: mock });
        let formId = createFormResponse.data.formBuilder.createForm.data.id;

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fb.form", rwd: "w" }], identityA],
            [[{ name: "fb.form", rwd: "rw" }], identityA],
            [[{ name: "fb.form", own: true }], identityB]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { deleteForm } = useGqlHandler({ permissions, identity });
            const [response] = await deleteForm({ id: formId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("deleteForm"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { deleteForm } = useGqlHandler({ permissions, identity });
            const [response] = await deleteForm({ id: formId });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        deleteForm: {
                            data: true,
                            error: null
                        }
                    }
                }
            });

            // Let's restore the form.
            [createFormResponse] = await createForm({ data: mock });
            formId = createFormResponse.data.formBuilder.createForm.data.id;
        }
    });

    const insufficientPublishPermissions: IdentityPermissions = [
        [[], null],
        [[], identityA],
        [[{ name: "fb.form" }], identityA],
        [[{ name: "fb.form", rwd: "rw" }], identityA],
        [[{ name: "fb.form", own: true }], identityB],
        [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", own: true, rwd: "r", pw: "" }], identityA]
    ];

    test.each(insufficientPublishPermissions)(
        `do not allow "publishForm" with %j`,
        async (permissions, identity) => {
            const { createForm } = defaultHandler;
            const mock = new Mock("publishRevision-form-");

            const [createFormResponse] = await createForm({ data: mock });
            const formId = createFormResponse.data.formBuilder.createForm.data.id;

            const { publishRevision } = useGqlHandler({ permissions, identity });
            const [response] = await publishRevision({ revision: formId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("publishRevision"));
        }
    );

    const sufficientPublishPermissions: IdentityPermissions = [
        [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", rwd: "r", pw: "pu" }], identityA],
        [[{ name: "content.i18n" }, { name: "fb.form", own: true, pw: "pu" }], identityA]
    ];

    test.each(sufficientPublishPermissions)(
        `allow "publishForm" with %j`,
        async (permissions, identity) => {
            const { createForm } = defaultHandler;
            const mock = new Mock("publishRevision-form-");

            const [createFormResponse] = await createForm({ data: mock });
            const formId = createFormResponse.data.formBuilder.createForm.data.id;

            const { publishRevision } = useGqlHandler({ permissions, identity });
            const [response] = await publishRevision({ revision: formId });
            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        publishRevision: {
                            data: {
                                ...new MockResponse({
                                    prefix: `publishRevision-form-`,
                                    id: formId
                                }),
                                publishedOn: /^20/,
                                status: "published"
                            },
                            error: null
                        }
                    }
                }
            });
        }
    );

    test(`allow "createRevisionFrom" if identity has sufficient permissions`, async () => {
        const { createForm, publishRevision } = defaultHandler;
        const mock = new Mock("create-revision-form-");

        const [createFormResponse] = await createForm({ data: mock });
        const { id: formId } = createFormResponse.data.formBuilder.createForm.data;

        // Let's also publish the form.
        const [publish] = await publishRevision({ revision: formId });

        expect(publish).toMatchObject({
            data: {
                formBuilder: {
                    publishRevision: {
                        data: {
                            ...new MockResponse({
                                prefix: "create-revision-form-",
                                id: formId
                            }),
                            publishedOn: /^20/,
                            status: "published"
                        },
                        error: null
                    }
                }
            }
        });

        const insufficientPermissions: IdentityPermissions = [
            [[], null],
            [[], identityA],
            [[{ name: "fb.form", own: false, rwd: "r" }], identityA],
            [[{ name: "fb.form", own: false, rwd: "rd" }], identityA]
        ];

        for (let i = 0; i < insufficientPermissions.length; i++) {
            const [permissions, identity] = insufficientPermissions[i];
            const { createRevisionFrom } = useGqlHandler({ permissions, identity });
            const [response] = await createRevisionFrom({ revision: formId });
            expect(response).toEqual(NOT_AUTHORIZED_RESPONSE("createRevisionFrom"));
        }

        const sufficientPermissions: IdentityPermissions = [
            [[{ name: "content.i18n" }, { name: "fb.form" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", own: true }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "w" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rw" }], identityA],
            [[{ name: "content.i18n" }, { name: "fb.form", rwd: "rwd" }], identityA]
        ];

        for (let i = 0; i < sufficientPermissions.length; i++) {
            const [permissions, identity] = sufficientPermissions[i];
            const { createRevisionFrom } = useGqlHandler({ permissions, identity });
            const [response] = await createRevisionFrom({ revision: formId });

            const { id } = response.data.formBuilder.createRevisionFrom.data;

            expect(response).toMatchObject({
                data: {
                    formBuilder: {
                        createRevisionFrom: {
                            data: {
                                ...new MockResponse({
                                    prefix: "create-revision-form-",
                                    id
                                }),
                                publishedOn: /^20/,
                                status: "draft",
                                version: i + 2
                            },
                            error: null
                        }
                    }
                }
            });

            // Let's also publish this form.
            const [publish] = await publishRevision({ revision: id });
            expect(publish).toMatchObject({
                data: {
                    formBuilder: {
                        publishRevision: {
                            data: {
                                ...new MockResponse({
                                    prefix: "create-revision-form-",
                                    id
                                }),
                                publishedOn: /^20/,
                                status: "published",
                                version: i + 2
                            },
                            error: null
                        }
                    }
                }
            });
        }
    });
});

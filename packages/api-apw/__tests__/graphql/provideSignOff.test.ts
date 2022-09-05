import { ApwContentReviewStepStatus } from "~/types";
import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";
import { createSetupForPageContentReview } from "../utils/helpers";
import { mocks as changeRequestMock } from "./mocks/changeRequest";

describe("Provide sign off for a step in content review process", function () {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = usePageBuilderHandler({
        ...options
    });
    const {
        getContentReviewQuery,
        createContentReviewMutation,
        provideSignOffMutation,
        createChangeRequestMutation,
        until
    } = gqlHandler;

    const setup = async () => {
        return createSetupForPageContentReview(gqlHandler);
    };

    const expectedContent = {
        id: expect.any(String),
        type: expect.any(String),
        version: expect.any(Number),
        settings: null,
        publishedBy: null,
        publishedOn: null,
        scheduledBy: null,
        scheduledOn: null
    };

    test(`should able to provide sign-off`, async () => {
        const { page } = await setup();
        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const [step1, , step3] = createdContentReview.steps;
        let previousSavedOn = createdContentReview.savedOn;

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );

        /**
         * Should return error while providing sign-off for "inactive" step.
         */
        let [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step3.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: null,
                        error: {
                            code: "STEP_NOT_ACTIVE",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should able to providing sign-off for "active" step.
         */
        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => {
                const entry = response.data.apw.getContentReview.data;

                const hasChanged = entry && entry.savedOn !== previousSavedOn;
                if (hasChanged) {
                    previousSavedOn = entry.savedOn;
                    return true;
                }
                return false;
            },
            {
                name: "Wait for updated entry to be available in get query"
            }
        );

        /**
         * Now that we've provided sign-off for step1, step2 should have status "active" because step1 is done
         * and step3 should also have status "active" because step2 is not of type "mandatory_blocking".
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(getContentReviewResponse).toEqual({
            data: {
                apw: {
                    getContentReview: {
                        data: {
                            id: expect.any(String),
                            createdOn: expect.stringMatching(/^20/),
                            savedOn: expect.stringMatching(/^20/),
                            createdBy: {
                                id: "12345678",
                                displayName: "John Doe",
                                type: "admin"
                            },
                            status: "underReview",
                            title: expect.any(String),
                            content: expect.objectContaining(expectedContent),
                            steps: [
                                {
                                    status: ApwContentReviewStepStatus.DONE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: expect.stringMatching(/^20/),
                                    signOffProvidedBy: {
                                        id: "12345678",
                                        displayName: "John Doe"
                                    }
                                },
                                {
                                    status: ApwContentReviewStepStatus.ACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                },
                                {
                                    status: ApwContentReviewStepStatus.ACTIVE,
                                    id: expect.any(String),
                                    pendingChangeRequests: 0,
                                    signOffProvidedOn: null,
                                    signOffProvidedBy: null
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });
    });

    test(`should throw error when trying to provide sign off by a non-reviewer`, async () => {
        const gqlHandlerForIdentityA = usePageBuilderHandler({
            ...options,
            identity: {
                id: "123456789",
                type: "admin",
                displayName: "Ryan"
            }
        });

        const { page } = await setup();
        await gqlHandlerForIdentityA.securityIdentity.login();

        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const [step1] = createdContentReview.steps;

        await until(
            () =>
                gqlHandlerForIdentityA
                    .getContentReviewQuery({ id: createdContentReview.id })
                    .then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );

        /**
         * Should return error while providing sign-off for a step by a non-reviewer.
         */
        const [provideSignOffResponse] = await gqlHandlerForIdentityA.provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: null,
                        error: {
                            code: "NOT_AUTHORISED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });

    test(`should throw error when trying to provide sign off without completing previous steps`, async () => {
        const { page } = await setup();

        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const [step1, step2, step3] = createdContentReview.steps;

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );
        let previousSavedOn = createdContentReview.savedOn;

        /**
         * Should return error while providing sign off without completing "mandatory_blocking" step.
         */
        let [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step2.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: null,
                        error: {
                            code: "MISSING_STEP",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
        /**
         * Let's providing sign off for "mandatory_blocking" step.
         */
        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.id
        });

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => {
                const entry = response.data.apw.getContentReview.data;
                const hasChanged = entry && entry.savedOn !== previousSavedOn;
                if (hasChanged) {
                    previousSavedOn = entry.savedOn;
                    return true;
                }
                return false;
            },
            {
                name: "Wait for updated entry to be available in get query"
            }
        );

        /**
         * Should able to providing sign off even if previous step is not done;
         * given it is of "mandatory_non_blocking" type.
         */

        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step3.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Should able to providing sign off after completing "mandatory_blocking" step.
         */
        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step2.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });
    });

    test(`should throw error when trying to create new "Change Request" once sign off has been provided`, async () => {
        const { page } = await setup();

        /*
         Create a content review entry.
        */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: page.id,
                    type: "page"
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        const [step1, step2, step3] = createdContentReview.steps;

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => response.data.apw.getContentReview.data !== null,
            {
                name: "Wait for entry to be available in get query"
            }
        );
        let previousSavedOn = createdContentReview.savedOn;

        /**
         * Let's providing sign off for "mandatory_blocking" step.
         */
        let [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step1.id
        });

        await until(
            () => getContentReviewQuery({ id: createdContentReview.id }).then(([data]) => data),
            (response: any) => {
                const entry = response.data.apw.getContentReview.data;
                const hasChanged = entry && entry.savedOn !== previousSavedOn;
                if (hasChanged) {
                    previousSavedOn = entry.savedOn;
                    return true;
                }
                return false;
            },
            {
                name: "Wait for updated entry to be available in get query"
            }
        );

        /**
         * Should able to providing sign off even if previous step is not done;
         * given it is of "mandatory_non_blocking" type.
         */

        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step3.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Should able to providing sign off after completing "mandatory_blocking" step.
         */
        [provideSignOffResponse] = await provideSignOffMutation({
            id: createdContentReview.id,
            step: step2.id
        });
        expect(provideSignOffResponse).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Should return error when creating a new change request after sign-off has been provided.
         */

        const changeRequestStep = `${createdContentReview.id}#${createdContentReview.steps[0].id}`;
        const [createChangeRequestResponse] = await createChangeRequestMutation({
            data: changeRequestMock.createChangeRequestInput({ step: changeRequestStep })
        });
        expect(createChangeRequestResponse).toEqual({
            data: {
                apw: {
                    createChangeRequest: {
                        data: null,
                        error: {
                            code: "SIGN_OFF_PROVIDED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });
    });
});

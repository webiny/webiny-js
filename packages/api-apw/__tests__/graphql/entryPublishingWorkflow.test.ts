import { createSetupForEntryContentReview } from "../utils/cms.helpers";
import { useContentHeadlessCmsHandler } from "../utils/useContentHeadlessCmsHandler";
import { ApwContentTypes } from "~/scheduler/types";

const updatedProductName = "Updated Webiny product";

describe("Cms Entry Publishing Workflow", () => {
    const options = {
        path: "manage/en-US"
    };

    const gqlHandler = useContentHeadlessCmsHandler({
        ...options
    });
    const {
        getContentEntryQuery,
        createContentReviewMutation,
        updateContentEntryMutation,
        createContentEntryFromMutation,
        getContentReviewQuery,
        provideSignOffMutation,
        retractSignOffMutation,
        publishContentMutation,
        unpublishContentMutation
    } = gqlHandler;

    const setup = async () => {
        return createSetupForEntryContentReview(gqlHandler);
    };

    it(`should be able to "publish" entry for content review process`, async () => {
        const { entry, model, workflow } = await setup();

        /**
         *  Initial review.
         */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: entry.id,
                    type: ApwContentTypes.CMS_ENTRY,
                    settings: {
                        modelId: model.modelId
                    }
                }
            }
        });

        /*
         * Check content status, it should be "under review".
         */
        expect(createContentReviewResponse).toMatchObject({
            data: {
                apw: {
                    createContentReview: {
                        data: {
                            id: expect.stringMatching(/^([a-z0-9]+)\#0001$/),
                            content: {
                                id: entry.id,
                                type: ApwContentTypes.CMS_ENTRY,
                                version: 1
                            },
                            status: "underReview",
                            title: entry.name
                        },
                        error: null
                    }
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;
        /*
         *  We should be able to make updates to the entry.
         */
        const [updateEntryResponse] = await updateContentEntryMutation(model, {
            revision: entry.id,
            data: {
                sku: entry.sku,
                description: entry.description,
                body: entry.body,
                name: updatedProductName
            }
        });
        const updatedProduct = updateEntryResponse.data.updateProduct.data;
        /**
         * CMS Entry should have "apw" properties after update.
         */
        expect(updateEntryResponse).toMatchObject({
            data: {
                updateProduct: {
                    data: {
                        id: entry.id,
                        entryId: entry.entryId,
                        meta: {
                            data: {
                                apw: {
                                    workflowId: workflow.id,
                                    contentReviewId: createdContentReview.id
                                }
                            }
                        }
                    },
                    error: null
                }
            }
        });
        /**
         * Fetch the content review and check if the updates were successful.
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const contentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(contentReview.status).toEqual("underReview");
        expect(contentReview.title).toEqual(updatedProduct.name);

        /**
         * Should not let us publish a entry.
         */
        const [publishContentResponse] = await publishContentMutation({ id: contentReview.id });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            code: "NOT_READY_TO_BE_PUBLISHED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should be able to create a new revision, even though the content is "underReview".
         */
        const [createProductFromResponse] = await createContentEntryFromMutation(model, {
            revision: entry.id
        });
        /**
         * Should still have the workflow assigned.
         * But, should not have "contentReviewId".
         */
        expect(createProductFromResponse).toEqual({
            data: {
                createProductFrom: {
                    data: {
                        id: `${entry.entryId}#0002`,
                        entryId: entry.entryId,
                        name: updatedProductName,
                        sku: entry.sku,
                        body: entry.body,
                        description: entry.description,
                        meta: {
                            data: {
                                apw: {
                                    workflowId: workflow.id,
                                    contentReviewId: null
                                }
                            },
                            status: "draft",
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Let's provide sign-off to every step of the publishing workflow.
         */
        const [step1, step2, step3] = contentReview.steps;

        const [provideSignOffResponse] = await provideSignOffMutation({
            id: contentReview.id,
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

        const [provideSignOff2Response] = await provideSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });

        expect(provideSignOff2Response).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [provideSignOff3Response] = await provideSignOffMutation({
            id: contentReview.id,
            step: step3.id
        });

        expect(provideSignOff3Response).toEqual({
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
         * After providing sign-off to every step of the workflow,
         * Now the content should be in "readyToBePublished" stage.
         */
        const [getContentReviewAfterSignOffResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const updatedContentReview =
            getContentReviewAfterSignOffResponse.data.apw.getContentReview.data;
        expect(updatedContentReview.status).toEqual("readyToBePublished");
        expect(updatedContentReview.title).toEqual(updatedProduct.name);

        /**
         * Let's retract the provided sign-off for a "required step" of the publishing workflow.
         */
        const [retractSignOffResponse] = await retractSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                apw: {
                    retractSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After retracting sign-off to a step of the workflow,
         * Now the content should be back in "underReview" stage.
         */
        const [getContentReviewAfterRetractingSignOffResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(
            getContentReviewAfterRetractingSignOffResponse.data.apw.getContentReview.data.status
        ).toEqual("underReview");

        /**
         * Let's again provide the sign-off for step 2.
         */
        const [provideSignOff2AgainResponse] = await provideSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });

        expect(provideSignOff2AgainResponse).toEqual({
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
         * After providing sign-off to every step of the workflow,
         * Should be able to publish the entry.
         */
        const [publishContentAfterAllSignOffResponse] = await publishContentMutation({
            id: contentReview.id
        });
        expect(publishContentAfterAllSignOffResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "published".
         */
        const [getProductResponse] = await getContentEntryQuery(model, { revision: entry.id });
        expect(getProductResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        ...updatedProduct,
                        meta: {
                            ...updatedProduct.meta,
                            status: "published",
                            data: {
                                ...updatedProduct.meta.data
                            }
                        }
                    },
                    error: null
                }
            }
        });

        expect(getProductResponse.data.getProduct.data.meta.status).toEqual("published");
        expect(getProductResponse.data.getProduct.data.meta.version).toEqual(1);

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        const [getContentReviewAfterPublishResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewAfterPublishResponse.data.apw.getContentReview.data.status).toEqual(
            "published"
        );
    });

    test(`Should able to "unpublish" entry for content review process`, async () => {
        const { entry, model } = await setup();

        /**
         *  Initial a review.
         */
        const [createContentReviewResponse] = await createContentReviewMutation({
            data: {
                content: {
                    id: entry.id,
                    type: ApwContentTypes.CMS_ENTRY,
                    settings: {
                        modelId: model.modelId
                    }
                }
            }
        });
        const createdContentReview = createContentReviewResponse.data.apw.createContentReview.data;

        /*
         * Check content status, it should be "under review".
         */
        expect(createdContentReview.status).toEqual("underReview");
        expect(createdContentReview.title).toEqual(entry.name);

        /*
         *  We should be able to make updates to the entry.
         */
        const [updateProductResponse] = await updateContentEntryMutation(model, {
            revision: entry.id,
            data: {
                sku: entry.sku,
                description: entry.description,
                body: entry.body,
                name: updatedProductName
            }
        });
        const updatedProduct = updateProductResponse.data.updateProduct.data;
        /**
         * Fetch the content review and check if the updates were successful.
         */
        const [getContentReviewResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const contentReview = getContentReviewResponse.data.apw.getContentReview.data;
        expect(contentReview.status).toEqual("underReview");
        expect(contentReview.title).toEqual(updatedProduct.name);

        /**
         * Should not let us publish a entry.
         */
        const [publishContentResponse] = await publishContentMutation({
            id: contentReview.id
        });
        expect(publishContentResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: null,
                        error: {
                            code: "NOT_READY_TO_BE_PUBLISHED",
                            message: expect.any(String),
                            data: expect.any(Object)
                        }
                    }
                }
            }
        });

        /**
         * Should be able to create a new revision, even though the content is "underReview".
         */
        const [createProductFromResponse] = await createContentEntryFromMutation(model, {
            revision: updatedProduct.id
        });
        expect(createProductFromResponse).toEqual({
            data: {
                createProductFrom: {
                    data: {
                        ...updatedProduct,
                        name: updatedProductName,
                        id: `${updatedProduct.entryId}#0002`,
                        meta: {
                            ...updatedProduct.meta,
                            data: {
                                ...updatedProduct.meta.data,
                                apw: {
                                    ...updatedProduct.meta.data.apw,
                                    contentReviewId: null
                                }
                            },
                            version: 2
                        }
                    },
                    error: null
                }
            }
        });

        const createdFromProduct = createProductFromResponse.data.createProductFrom.data;
        /**
         * Should still have the workflow assigned.
         * But, should not have "contentReviewId".
         */
        expect(createdFromProduct.meta.data.apw).toEqual({
            workflowId: updatedProduct.meta.data.apw.workflowId,
            contentReviewId: null
        });

        /**
         * Let's provide sign-off to every step of the publishing workflow.
         */
        const [step1, step2, step3] = contentReview.steps;

        const [provideSignOff1Response] = await provideSignOffMutation({
            id: contentReview.id,
            step: step1.id
        });

        expect(provideSignOff1Response).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [provideSignOff2Response] = await provideSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });

        expect(provideSignOff2Response).toEqual({
            data: {
                apw: {
                    provideSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [provideSignOff3Response] = await provideSignOffMutation({
            id: contentReview.id,
            step: step3.id
        });

        expect(provideSignOff3Response).toEqual({
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
         * After providing sign-off to every step of the workflow,
         * Now the content should be in "readyToBePublished" stage.
         */
        const [getContentReviewAfterSignOffResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        const updatedContentReview =
            getContentReviewAfterSignOffResponse.data.apw.getContentReview.data;
        expect(updatedContentReview.status).toEqual("readyToBePublished");
        expect(updatedContentReview.title).toEqual(updatedProduct.name);

        /**
         * Let's retract the provided sign-off for a "required step" of the publishing workflow.
         */
        const [retractSignOffResponse] = await retractSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });
        expect(retractSignOffResponse).toEqual({
            data: {
                apw: {
                    retractSignOff: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * After retracting sign-off to a step of the workflow,
         * Now the content should be back in "underReview" stage.
         */
        const [getContentReviewAfterRetractingResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });
        expect(
            getContentReviewAfterRetractingResponse.data.apw.getContentReview.data.status
        ).toEqual("underReview");

        /**
         * Let's again provide the sign-off for step 2.
         */
        const [provideSignOffAfterRetractingResponse] = await provideSignOffMutation({
            id: contentReview.id,
            step: step2.id
        });

        expect(provideSignOffAfterRetractingResponse).toEqual({
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
         * After providing sign-off to every step of the workflow,
         * Should be able to publish the entry.
         */
        const [publishContentAfterSignOffResponse] = await publishContentMutation({
            id: contentReview.id
        });
        expect(publishContentAfterSignOffResponse).toEqual({
            data: {
                apw: {
                    publishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "published".
         */
        const [getProductResponse] = await getContentEntryQuery(model, {
            revision: updatedProduct.id
        });
        expect(getProductResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        ...updatedProduct,
                        meta: {
                            ...updatedProduct.meta,
                            data: {
                                ...updatedProduct.meta.data,
                                apw: {
                                    ...updatedProduct.meta.data.apw,
                                    contentReviewId: contentReview.id
                                }
                            },
                            status: "published",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        expect(getProductResponse.data.getProduct.data.meta.status).toEqual("published");
        expect(getProductResponse.data.getProduct.data.meta.version).toEqual(1);

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        const [getContentReviewAfterPublishResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(getContentReviewAfterPublishResponse.data.apw.getContentReview.data.status).toEqual(
            "published"
        );

        /**
         * Let's "unpublish" the content.
         */
        const [unPublishContentResponse] = await unpublishContentMutation({
            id: contentReview.id
        });
        expect(unPublishContentResponse).toEqual({
            data: {
                apw: {
                    unpublishContent: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        /**
         * Let's confirm that the content is "unpublished".
         */
        const [getProductAfterUnpublishResponse] = await getContentEntryQuery(model, {
            revision: updatedProduct.id
        });
        expect(getProductAfterUnpublishResponse).toEqual({
            data: {
                getProduct: {
                    data: {
                        ...updatedProduct,
                        meta: {
                            ...updatedProduct.meta,
                            status: "unpublished",
                            version: 1
                        }
                    },
                    error: null
                }
            }
        });

        /**
         * Fetch the content review and check if the status has been updated successful.
         */
        const [getContentReviewAfterUnpublishResponse] = await getContentReviewQuery({
            id: createdContentReview.id
        });

        expect(
            getContentReviewAfterUnpublishResponse.data.apw.getContentReview.data.status
        ).toEqual("readyToBePublished");
    });
});

import { usePageBuilderHandler } from "../utils/usePageBuilderHandler";
import { ApwContentTypes } from "~/types";
import { createSetupForPageContentReview } from "../utils/helpers";

describe("Is review required test", () => {
    const gqlHandler = usePageBuilderHandler();
    const { isReviewRequiredQuery, createContentReviewMutation } = gqlHandler;

    const setup = async () => {
        return createSetupForPageContentReview(gqlHandler);
    };

    test(`should able to create, update, get, list and delete "Content Review"`, async () => {
        const { page } = await setup();

        /**
         * Should require a review but there should not be any existing content review.
         */
        let [isReviewRequiredResponse] = await isReviewRequiredQuery({
            data: {
                id: page.id,
                type: ApwContentTypes.PAGE
            }
        });
        expect(isReviewRequiredResponse).toEqual({
            data: {
                apw: {
                    isReviewRequired: {
                        data: {
                            isReviewRequired: true,
                            contentReviewId: null
                        },
                        error: null
                    }
                }
            }
        });

        /*
         * Let's create a content review.
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

        expect(createContentReviewResponse).toEqual({
            data: {
                apw: {
                    createContentReview: {
                        data: expect.any(Object),
                        error: null
                    }
                }
            }
        });

        /**
         * Now, after initiating a content review,
         * we should still get "isReviewRequired" and there should be any existing content review.
         */
        [isReviewRequiredResponse] = await isReviewRequiredQuery({
            data: {
                id: page.id,
                type: ApwContentTypes.PAGE
            }
        });
        expect(isReviewRequiredResponse).toEqual({
            data: {
                apw: {
                    isReviewRequired: {
                        data: {
                            isReviewRequired: true,
                            contentReviewId: createdContentReview.id
                        },
                        error: null
                    }
                }
            }
        });
    });
});

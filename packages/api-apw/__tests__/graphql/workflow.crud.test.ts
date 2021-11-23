import { useContentGqlHandler } from "../utils/useContentGqlHandler";

describe("Workflow crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const { getWorkflowQuery, createWorkflowMutation } = useContentGqlHandler({
        ...options
    });
    test("should able to get workflow by Id", async () => {
        const [getWorkflowResponse] = await getWorkflowQuery({ id: "123" });
        expect(getWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getWorkflow: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Entry not found!"
                        }
                    }
                }
            }
        });

        const [createWorkflowResponse] = await createWorkflowMutation({
            data: {
                app: "PageBuilder",
                title: "Main workflow",
                steps: [
                    {
                        title: "Legal Review",
                        type: "mandatory_blocking",
                        reviewers: [{ id: "123" }]
                    }
                ],
                scope: {
                    type: "default"
                }
            }
        });
        expect(createWorkflowResponse).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    createWorkflow: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });
});

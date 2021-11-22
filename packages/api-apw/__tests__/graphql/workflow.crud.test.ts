import { useGqlHandler } from "../utils/useGqlHandler";

describe("Workflow crud test", () => {
    const options = {
        path: "manage/en-US"
    };

    const { getWorkflowQuery } = useGqlHandler({
        ...options
    });

    test("should able to get workflow", async () => {
        const [response] = await getWorkflowQuery({ id: "123" });
        expect(response).toEqual({
            data: {
                advancedPublishingWorkflow: {
                    getWorkflow: {
                        data: {
                            id: "123"
                        },
                        error: null
                    }
                }
            }
        });
    });
});

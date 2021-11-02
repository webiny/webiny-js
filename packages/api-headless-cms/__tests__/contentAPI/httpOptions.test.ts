import { useCategoryManageHandler } from "../utils/useCategoryManageHandler";

describe("HTTP Options request", () => {
    const manageOpts = { path: "manage/en-US" };

    test(`http options`, async () => {
        const { invoke } = useCategoryManageHandler(manageOpts);

        const response = await invoke({
            httpMethod: "OPTIONS",
            body: undefined
        });

        expect(response).toEqual([
            null,
            {
                body: "",
                headers: {
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json"
                },
                isBase64Encoded: undefined,
                statusCode: 204
            }
        ]);
    });
});

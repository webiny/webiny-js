import { createApiGatewayHandler } from "~/index";

describe("api gateway", () => {
    it("should create handler", async () => {
        const handler = createApiGatewayHandler({
            plugins: []
        });

        expect(handler).not.toBeNull();
    });
});

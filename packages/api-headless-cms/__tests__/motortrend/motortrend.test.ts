import { useGraphQLHandler } from "./setup/useContextHandler";
import { createCarData } from "./setup/car";
import { CmsModel } from "~/types";

describe("motortrend testing", () => {
    const { handle } = useGraphQLHandler();

    it("should store cars", async () => {
        const context = await handle();

        const model = (await context.cms.getModel("cars")) as CmsModel;

        expect(model).toMatchObject({
            modelId: "cars"
        });

        const entry = await context.cms.createEntry(model, createCarData());

        expect(entry).toMatchObject({
            id: expect.stringMatching(/([a-zA-Z0-9]+)#0001$/)
        });
    });
});

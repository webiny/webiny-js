import { createHandler } from "~/fastify";
import { createModifyFastifyPlugin } from "~/plugins/ModifyFastifyPlugin";

describe("modify fastify with plugin", () => {
    it("should modify existing Fastify instance via the plugin", async () => {
        const app = createHandler({
            plugins: [
                createModifyFastifyPlugin(instance => {
                    (instance as any).modifiedValue = true;
                })
            ]
        });

        expect((app as any).modifiedValue).toEqual(true);
    });
});

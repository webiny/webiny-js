import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { ModelFactory } from "~/features/modelBuilder/index.js";
import { ModelCache } from "~/features/contentModel/shared/abstractions.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/abstractions.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/abstractions.js";

class HiddenModelFactory implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        const model = builder.public({
            modelId: "hiddenModel",
            name: "Hidden Model",
            group: "ungrouped"
        });
        model.fields(fields => ({
            title: fields.text().label("Title")
        }));
        return [model];
    }
}

const registerHiddenModel = (container: Container) => {
    const factory = new HiddenModelFactory();
    container.registerInstance(ModelFactory, factory);
};

describe("ModelsFetcher access control", () => {
    it("should not let a restricted read shrink a later read without authorization", async () => {
        const { handler } = useHandler({
            // This identity may read one other model, not "hiddenModel".
            permissions: [
                { name: "cms.contentModelGroup", rwd: "r" },
                { name: "cms.contentModel", rwd: "r", models: ["someOtherModel"] },
                { name: "cms.endpoint.manage" }
            ],
            plugins: [registerHiddenModel]
        });
        const { container } = await handler({ path: "/graphql", headers: { "x-tenant": "root" } });

        // Start from an empty per-request model cache, so the restricted read below is the first.
        const modelCache = container.resolve(ModelCache);
        modelCache.clear();

        const getModel = container.resolve(GetModelUseCase);
        const restricted = await getModel.execute("hiddenModel");
        expect(restricted.isFail()).toBe(true);

        const identityContext = container.resolve(IdentityContext);
        const listModels = container.resolve(ListModelsUseCase);
        const unrestricted = await identityContext.withoutAuthorization(() => {
            return listModels.execute();
        });

        const modelIds = unrestricted.value.map(model => model.modelId);
        expect(modelIds).toContain("hiddenModel");
    });
});

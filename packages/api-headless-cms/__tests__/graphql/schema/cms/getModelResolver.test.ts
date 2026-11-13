import { describe, expect, it, vi } from "vitest";
import { createGetModelResolver } from "~/graphql/schema/cms/getModelResolver";
import type { CmsContext } from "~/types";

const createContext = (permissions: string[]) => {
    const getModel = vi.fn(async () => {
        throw new Error("Model lookup reached.");
    });
    const context = {
        security: {
            getPermission: vi.fn(async (name: string) => {
                return permissions.includes(name) ? { name } : null;
            })
        },
        cms: {
            getModel
        }
    } as unknown as CmsContext;
    return { context, getModel };
};

describe("CMS proxy - getModel resolver", () => {
    it("should not return a model without any CMS endpoint permission", async () => {
        const { context, getModel } = createContext([]);
        const resolver = createGetModelResolver();

        const result = await resolver({ args: { modelId: "article" }, context });

        expect(result).toEqual({
            data: null,
            error: {
                message: "Not allowed to access CMS endpoints.",
                code: "GET_MODEL_ERROR"
            }
        });
        expect(getModel).not.toHaveBeenCalled();
    });

    it.each(["cms.endpoint.read", "cms.endpoint.preview", "cms.endpoint.manage"])(
        "should continue to the model lookup with the %s permission",
        async permission => {
            const { context, getModel } = createContext([permission]);
            const resolver = createGetModelResolver();

            const result = await resolver({ args: { modelId: "article" }, context });

            expect(getModel).toHaveBeenCalledWith("article");
            expect(result).toMatchObject({
                data: null,
                error: { message: "Model lookup reached.", code: "GET_MODEL_ERROR" }
            });
        }
    );
});

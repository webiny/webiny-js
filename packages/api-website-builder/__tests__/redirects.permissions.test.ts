import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";

describe("Redirects Use Cases (Unauthorized)", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const handler = useHandler({ permissions: [] });
        context = await handler.handler();
    });

    it("should not be able to create a redirect", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const result = await createRedirect.execute(redirectMocks.redirectA);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });

    it("should not be able to update a redirect", async () => {
        const updateRedirect = context.container.resolve(UpdateRedirectUseCase);
        const result = await updateRedirect.execute("id", {});

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });

    it("should not be able to get redirect by id", async () => {
        const getRedirectById = context.container.resolve(GetRedirectByIdUseCase);
        const result = await getRedirectById.execute("some-id");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });

    it("should not be able to list redirects", async () => {
        const listRedirects = context.container.resolve(ListRedirectsUseCase);
        const result = await listRedirects.execute({
            where: {},
            limit: 100,
            after: null,
            sort: []
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });

    it("should not be able to delete a redirect", async () => {
        const deleteRedirect = context.container.resolve(DeleteRedirectUseCase);
        const result = await deleteRedirect.execute({ id: "some-id" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });

    it("should not be able to get active redirects", async () => {
        const getActiveRedirects = context.container.resolve(GetActiveRedirectsUseCase);
        const result = await getActiveRedirects.execute();

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("WebsiteBuilder/Redirect/NotAuthorized");
    });
});

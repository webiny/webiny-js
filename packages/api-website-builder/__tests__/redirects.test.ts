import { describe, it, expect, beforeEach } from "vitest";
import { useHandler } from "./utils/useHandler.js";
import { redirectMocks } from "./mocks/redirect.mock.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { until } from "@webiny/project-utils/testing/helpers/until";
import { CreateRedirectUseCase } from "~/features/redirects/CreateRedirect/index.js";
import { UpdateRedirectUseCase } from "~/features/redirects/UpdateRedirect/index.js";
import { GetRedirectByIdUseCase } from "~/features/redirects/GetRedirectById/index.js";
import { ListRedirectsUseCase } from "~/features/redirects/ListRedirects/index.js";
import { DeleteRedirectUseCase } from "~/features/redirects/DeleteRedirect/index.js";
import { GetActiveRedirectsUseCase } from "~/features/redirects/GetActiveRedirects/index.js";
import type { ICreateWbRedirectData } from "~/features/redirects/CreateRedirect/abstractions.js";

describe("Redirects Use Cases (Authorized)", () => {
    let context: ApiCoreContext;

    beforeEach(async () => {
        const handler = useHandler({});
        context = await handler.handler();
    });

    it("should create a redirect", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const result = await createRedirect.execute(redirectMocks.redirectA);

        if (result.isFail()) {
            throw result.error;
        }

        const redirect = result.value;

        expect(redirect).toMatchObject({
            id: expect.any(String),
            ...redirectMocks.redirectA
        });
    });

    it("should update a redirect", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const createResult = await createRedirect.execute(redirectMocks.redirectA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const redirect = createResult.value;

        const updatedData: ICreateWbRedirectData = {
            redirectFrom: "/updated-redirectFrom",
            redirectTo: "/updated-redirectTo",
            isEnabled: false,
            redirectType: "permanent",
            location: redirect.location
        };

        const updateRedirect = context.container.resolve(UpdateRedirectUseCase);
        const updateResult = await updateRedirect.execute(redirect.id, updatedData);

        if (updateResult.isFail()) {
            throw updateResult.error;
        }

        const updatedRedirect = updateResult.value;

        expect(updatedRedirect).toMatchObject({
            id: redirect.id,
            redirectFrom: updatedData.redirectFrom,
            redirectTo: updatedData.redirectTo,
            isEnabled: updatedData.isEnabled,
            redirectType: updatedData.redirectType
        });
    });

    it("should get redirect by id", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const createResult = await createRedirect.execute(redirectMocks.redirectA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const redirect = createResult.value;

        const getRedirectById = context.container.resolve(GetRedirectByIdUseCase);

        const fetchedRedirect = await until(
            async () => {
                const result = await getRedirectById.execute(redirect.id);
                return result.isOk() ? result.value : null;
            },
            (result: any) => result !== null
        );

        expect(fetchedRedirect).toMatchObject(redirect);
    });

    it("should list redirects", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        await createRedirect.execute(redirectMocks.redirectA);
        await createRedirect.execute(redirectMocks.redirectB);
        await createRedirect.execute(redirectMocks.redirectC);

        const listRedirects = context.container.resolve(ListRedirectsUseCase);

        const result = await until(
            async () => {
                const listResult = await listRedirects.execute({
                    where: {},
                    limit: 100,
                    after: null,
                    sort: []
                });
                return listResult.isOk() ? listResult.value : { redirects: [], meta: {} };
            },
            (result: any) => result.redirects.length === 3
        );

        const { redirects, meta } = result;

        expect(redirects).toHaveLength(3);
        expect(meta).toMatchObject({
            hasMoreItems: false,
            totalCount: 3
        });
    });

    it("should delete a redirect", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const createResult = await createRedirect.execute(redirectMocks.redirectA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const redirect = createResult.value;

        const deleteRedirect = context.container.resolve(DeleteRedirectUseCase);
        await deleteRedirect.execute({ id: redirect.id });

        // Wait for deletion to be indexed
        const getRedirectById = context.container.resolve(GetRedirectByIdUseCase);

        const fetchedRedirect = await until(
            async () => {
                const result = await getRedirectById.execute(redirect.id);
                return result.isFail() ? null : result.value;
            },
            (result: any) => result === null,
            { tries: 10 }
        );

        expect(fetchedRedirect).toBeNull();
    });

    it("should get active redirects", async () => {
        const createRedirect = context.container.resolve(CreateRedirectUseCase);
        const createResult = await createRedirect.execute(redirectMocks.redirectA);

        if (createResult.isFail()) {
            throw createResult.error;
        }

        const redirect = createResult.value;

        const getActiveRedirects = context.container.resolve(GetActiveRedirectsUseCase);

        const redirects = await until(
            async () => {
                const result = await getActiveRedirects.execute();
                return result.isOk() ? result.value : [];
            },
            (result: any) => result.length > 0
        );

        expect(redirects).toEqual([redirect]);
    });

    // Note: Lifecycle hooks are now implemented as event handlers
    // These tests would need to be refactored to test event handler implementations directly
    // or use integration tests that verify the side effects of events
    it.skip("should trigger update lifecycle hooks", async () => {
        // TODO: Refactor to test event handlers
    });

    it.skip("should trigger delete lifecycle hooks", async () => {
        // TODO: Refactor to test event handlers
    });
});

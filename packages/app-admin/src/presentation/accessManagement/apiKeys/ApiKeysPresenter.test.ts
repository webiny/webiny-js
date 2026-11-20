import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ListCache } from "~/features/listCache/index.js";
import { ListPresenter } from "~/presentation/listPresenter/ListPresenter.js";
import { AssistantPageContext } from "~/features/assistantPageContext/abstractions.js";
import { AssistantPageContext as AssistantPageContextImpl } from "~/features/assistantPageContext/AssistantPageContext.js";
import { FormModelFactory } from "~/features/formModel/abstractions.js";
import { StringFormatter } from "~/features/stringFormatter/abstractions.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import { ListApiKeysUseCase } from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import { ApiKeysListCache } from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import { GetApiKeyUseCase } from "~/features/accessManagement/apiKeys/getApiKey/abstractions.js";
import { CreateApiKeyUseCase } from "~/features/accessManagement/apiKeys/createApiKey/abstractions.js";
import { UpdateApiKeyUseCase } from "~/features/accessManagement/apiKeys/updateApiKey/abstractions.js";
import { DeleteApiKeyUseCase } from "~/features/accessManagement/apiKeys/deleteApiKey/abstractions.js";
import { ApiKeysPresenter as Abstraction } from "./abstractions.js";
import { ApiKeysPresenter } from "./ApiKeysPresenter.js";

const API_KEYS = [
    { id: "key-1", name: "Website", slug: "website", token: "secret", permissions: [] }
] as unknown as ApiKey[];

describe("ApiKeysPresenter", () => {
    let presenter: Abstraction.Interface;
    let pageContext: AssistantPageContext.Interface;
    let getApiKey: Mock;

    beforeEach(() => {
        const container = new Container();
        const cache = new ListCache<ApiKey>();

        container.registerInstance(ApiKeysListCache, cache);
        container.registerInstance(ListApiKeysUseCase, {
            execute: vi.fn(async () => {
                cache.setItems(API_KEYS);
                return { data: API_KEYS };
            })
        } as unknown as ListApiKeysUseCase.Interface);
        getApiKey = vi.fn(async () => API_KEYS[0]);
        container.registerInstance(GetApiKeyUseCase, {
            execute: getApiKey
        } as unknown as GetApiKeyUseCase.Interface);
        container.registerInstance(FormModelFactory, {
            create: () => ({ vm: {}, setData: vi.fn() })
        } as unknown as FormModelFactory.Interface);
        container.registerInstance(StringFormatter, {} as StringFormatter.Interface);
        container.registerInstance(CreateApiKeyUseCase, {} as CreateApiKeyUseCase.Interface);
        container.registerInstance(UpdateApiKeyUseCase, {} as UpdateApiKeyUseCase.Interface);
        container.registerInstance(DeleteApiKeyUseCase, {} as DeleteApiKeyUseCase.Interface);
        container.register(AssistantPageContextImpl).inSingletonScope();
        container.register(ListPresenter);
        container.register(ApiKeysPresenter).inSingletonScope();

        presenter = container.resolve(Abstraction);
        pageContext = container.resolve(AssistantPageContext);
    });

    it("tells the assistant which API key is open, never its token", async () => {
        presenter.init();
        await presenter.selectApiKey("key-1");

        await vi.waitFor(() => {
            expect(pageContext.get()?.details).toMatchObject({ openApiKeyId: "key-1" });
        });
        expect(JSON.stringify(pageContext.get())).not.toContain("secret");
    });

    it("drops an API key lookup that finishes after the page was left", async () => {
        let resolve: (apiKey: ApiKey) => void = () => {};
        getApiKey.mockImplementationOnce(
            () =>
                new Promise<ApiKey>(done => {
                    resolve = done;
                })
        );

        presenter.init();
        const select = presenter.selectApiKey("key-1");
        presenter.dispose();
        resolve(API_KEYS[0]);
        await select;

        expect(presenter.vm.selectedApiKey).toBeNull();
        expect(presenter.vm.showForm).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });
});

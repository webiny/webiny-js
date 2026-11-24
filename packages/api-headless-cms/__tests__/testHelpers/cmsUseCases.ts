import type { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import type { CmsEntry, CmsModel, CreateCmsEntryInput } from "~/types/index.js";

/**
 * Thin helpers over the CMS use cases for tests that set up data from a captured container.
 * Each throws when the use case fails.
 */
export const useCmsUseCases = (container: Container) => {
    return {
        async getModel(modelId: string): Promise<CmsModel> {
            const result = await container.resolve(GetModelUseCase).execute(modelId);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },
        async createEntry(model: CmsModel, input: CreateCmsEntryInput): Promise<CmsEntry> {
            const result = await container.resolve(CreateEntryUseCase).execute(model, input);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },
        async publishEntry(model: CmsModel, id: string): Promise<CmsEntry> {
            const result = await container.resolve(PublishEntryUseCase).execute(model, id);
            if (result.isFail()) {
                throw result.error;
            }
            return result.value;
        },
        withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
            return container.resolve(IdentityContext).withoutAuthorization(cb);
        }
    };
};

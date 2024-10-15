import {
    CmsEntry,
    CmsEntryValues,
    CmsModelManager,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types";
import { WebinyError } from "@webiny/error";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants";
import { createCacheKey } from "@webiny/utils";

export interface ISingletonModelManager<T extends CmsEntryValues = CmsEntryValues> {
    update(data: UpdateCmsEntryInput, options?: UpdateCmsEntryOptionsInput): Promise<CmsEntry<T>>;
    get(): Promise<CmsEntry<T>>;
}

export class SingletonModelManager<T extends CmsEntryValues> implements ISingletonModelManager<T> {
    private readonly manager: CmsModelManager<T>;

    private constructor(manager: CmsModelManager<T>) {
        if (!manager.model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
            throw new WebinyError({
                message: "Model is not marked as singular.",
                code: "MODEL_NOT_MARKED_AS_SINGULAR",
                data: {
                    model: manager.model
                }
            });
        }
        this.manager = manager;
    }

    public async update(
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> {
        const entry = await this.get();

        return await this.manager.update(entry.id, data, options);
    }

    public async get(): Promise<CmsEntry<T>> {
        const id = createCacheKey(this.manager.model.modelId, {
            algorithm: "sha256",
            encoding: "hex"
        });
        try {
            return await this.manager.get(`${id}#0001`);
        } catch {
            return await this.manager.create(
                {
                    id
                },
                {
                    skipValidators: ["required"]
                }
            );
        }
    }

    public static create<T extends CmsEntryValues>(
        manager: CmsModelManager<T>
    ): ISingletonModelManager<T> {
        return new SingletonModelManager<T>(manager);
    }
}

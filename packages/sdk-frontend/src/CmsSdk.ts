import { Webiny, Result } from "@webiny/sdk";
import type {
    CmsEntryValues as SdkCmsEntryValues,
    CreateEntryParams,
    UpdateEntryRevisionParams,
    DeleteEntryRevisionParams,
    PublishEntryRevisionParams,
    UnpublishEntryRevisionParams
} from "@webiny/sdk";
import { contentSdk as cmsContentSdk } from "@webiny/cms-sdk";
import type {
    CmsEntryValues,
    CmsEntry,
    CmsListResult,
    CmsModelDefinition,
    GetEntryParams,
    ListEntriesParams
} from "@webiny/cms-sdk";
import { contentSdk as wbContentSdk } from "@webiny/website-builder-sdk";
import type { PublicLayout } from "@webiny/website-builder-sdk";

export interface GetLayoutForModelParams {
    // The language of the entry: the layout's published version in it, or else the source layout.
    language?: string | null;
}

export class CmsSdk {
    constructor(private webiny: Webiny) {}

    getModel(modelId: string): Promise<Result<CmsModelDefinition, Error>> {
        return cmsContentSdk.getModel(modelId).then(model => {
            return model
                ? Result.ok(model)
                : Result.fail(new Error(`Model "${modelId}" not found.`));
        });
    }

    /**
     * The published layout the model's entries render in: the one its `layout` setting names, composed with the
     * language's global components. `null` when the model has no `layout` setting (the API isn't called), or when
     * that layout isn't published. A failure to load the layout is a failed result, not a thrown error.
     */
    async getLayoutForModel(
        model: Pick<CmsModelDefinition, "settings">,
        params: GetLayoutForModelParams = {}
    ): Promise<Result<PublicLayout | null, Error>> {
        const slug = model.settings?.layout;
        if (typeof slug !== "string" || !slug) {
            return Result.ok(null);
        }

        try {
            const layout = await wbContentSdk.getLayout({ slug, language: params.language });
            return Result.ok(layout);
        } catch (error) {
            return Result.fail(error instanceof Error ? error : new Error(String(error)));
        }
    }

    getEntry<T extends CmsEntryValues = CmsEntryValues>(
        params: GetEntryParams
    ): Promise<Result<CmsEntry<T>, Error>> {
        return cmsContentSdk.getEntry<T>(params).then(entry => {
            return entry
                ? Result.ok(entry)
                : Result.fail(
                      new Error(`Entry "${params.entryId}" not found in model "${params.modelId}".`)
                  );
        });
    }

    listEntries<T extends CmsEntryValues = CmsEntryValues>(
        params: ListEntriesParams
    ): Promise<Result<CmsListResult<T>, Error>> {
        return cmsContentSdk.listEntries<T>(params).then(result => Result.ok(result));
    }

    createEntry<T extends SdkCmsEntryValues = SdkCmsEntryValues>(params: CreateEntryParams<T>) {
        return this.webiny.cms.createEntry<T>(params);
    }

    updateEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: UpdateEntryRevisionParams<T>
    ) {
        return this.webiny.cms.updateEntryRevision<T>(params);
    }

    deleteEntryRevision(params: DeleteEntryRevisionParams) {
        return this.webiny.cms.deleteEntryRevision(params);
    }

    publishEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: PublishEntryRevisionParams
    ) {
        return this.webiny.cms.publishEntryRevision<T>(params);
    }

    unpublishEntryRevision<T extends SdkCmsEntryValues = SdkCmsEntryValues>(
        params: UnpublishEntryRevisionParams
    ) {
        return this.webiny.cms.unpublishEntryRevision<T>(params);
    }
}

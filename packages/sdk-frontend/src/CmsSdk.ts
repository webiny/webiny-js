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

export class CmsSdk {
    constructor(private webiny: Webiny) {}

    getModel(modelId: string): Promise<Result<CmsModelDefinition, Error>> {
        return cmsContentSdk.getModel(modelId).then(model => {
            return model
                ? Result.ok(model)
                : Result.fail(new Error(`Model "${modelId}" not found.`));
        });
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

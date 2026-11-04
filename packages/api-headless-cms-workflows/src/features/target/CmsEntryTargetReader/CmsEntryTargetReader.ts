import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { GetEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntriesByIds/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import { CmsEntryTargetReader as Abstraction } from "./abstractions.js";
import { CmsModelGroupService } from "../CmsModelGroupService/index.js";

const MODEL_NOT_FOUND = "Cms/Model/NotFound";
const MODEL_NOT_AUTHORIZED = "Cms/Model/NotAuthorized";
const GROUP_NOT_FOUND = "Cms/ModelGroup/NotFound";
const GROUP_NOT_AUTHORIZED = "Cms/ModelGroup/NotAuthorized";
const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
// The identity has no entry permission on the model, so no revision is a target for it.
const ENTRIES_NOT_AUTHORIZED = "Cms/Entry/NotAuthorized";

interface TargetModel {
    model: CmsModel;
    group: CmsGroup;
}

/**
 * The model is read through the access-controlled `GetModelUseCase` as the current identity: a
 * model the user cannot read is no target for them, and nothing fills the tenant-keyed model cache
 * without access filtering (A19). The group is read the same way, so `CmsEntryAccess` can check
 * group read for another user without reading anything as them. The revision itself is read
 * without entry checks; callers decide access with `CmsEntryAccess`.
 */
class CmsEntryTargetReaderImpl implements Abstraction.Interface {
    public constructor(
        private getModel: GetModelUseCase.Interface,
        private modelGroups: CmsModelGroupService.Interface,
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getEntriesByIds: GetEntriesByIdsUseCase.Interface
    ) {}

    public async read(params: Abstraction.Params): Promise<Abstraction.Target | null> {
        const targetModel = await this.readModel(params.model);
        if (!targetModel) {
            return null;
        }

        const entry = await this.getRevisionById.execute(
            targetModel.model,
            params.targetRevisionId
        );
        if (entry.isFail()) {
            if (entry.error.code === ENTRY_NOT_FOUND) {
                return null;
            }
            throw entry.error;
        }

        return { ...targetModel, entry: entry.value };
    }

    public async readMany(params: Abstraction.ManyParams): Promise<Abstraction.Target[]> {
        if (params.targetRevisionIds.length === 0) {
            return [];
        }
        const targetModel = await this.readModel(params.model);
        if (!targetModel) {
            return [];
        }

        // One batch read for every revision (Q79); trashed revisions are left out.
        const revisionIds = [...new Set(params.targetRevisionIds)];
        const entries = await this.getEntriesByIds.execute(targetModel.model, revisionIds);
        if (entries.isFail()) {
            if (entries.error.code === ENTRIES_NOT_AUTHORIZED) {
                return [];
            }
            throw entries.error;
        }

        return entries.value.map(entry => ({ ...targetModel, entry }));
    }

    /** The model and its group as the current identity; `null` when they are no target. */
    private async readModel(namespace: string): Promise<TargetModel | null> {
        const modelId = getModelIdFromAppName(namespace);
        if (!modelId) {
            return null;
        }

        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (model.error.code === MODEL_NOT_FOUND || model.error.code === MODEL_NOT_AUTHORIZED) {
                return null;
            }
            throw model.error;
        }
        if (model.value.isPrivate) {
            return null;
        }

        const group = await this.modelGroups.getGroup(model.value);
        if (group.isFail()) {
            if (group.error.code === GROUP_NOT_FOUND || group.error.code === GROUP_NOT_AUTHORIZED) {
                return null;
            }
            throw group.error;
        }

        return { model: model.value, group: group.value };
    }
}

export const CmsEntryTargetReader = Abstraction.createImplementation({
    implementation: CmsEntryTargetReaderImpl,
    dependencies: [
        GetModelUseCase,
        CmsModelGroupService,
        GetRevisionByIdUseCase,
        GetEntriesByIdsUseCase
    ]
});

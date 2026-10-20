import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsGroup, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { GroupNotFoundError } from "@webiny/api-headless-cms/domain/contentModelGroup/errors.js";
import type { ListGroupsUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/ListGroups/index.js";

export type CmsModelGroupError = GroupNotFoundError | ListGroupsUseCase.Error;

export interface ICmsModelGroupService {
    /**
     * The model's group, read as the current identity. Fails with `Cms/ModelGroup/NotFound` when
     * no readable group has the model's slug, `Cms/ModelGroup/NotAuthorized` without group read,
     * or the list's persistence error.
     */
    getGroup(model: CmsModel): Promise<Result<CmsGroup, CmsModelGroupError>>;
}

/**
 * Finds a model's group. A model holds its group's slug, not its id (database groups get a
 * generated id), so the group is found by slug in the access-controlled group list, as the CMS
 * `AccessControl` does.
 */
export const CmsModelGroupService =
    createAbstraction<ICmsModelGroupService>("CmsModelGroupService");

export namespace CmsModelGroupService {
    export type Interface = ICmsModelGroupService;
    export type Error = CmsModelGroupError;
    export type Return = Promise<Result<CmsGroup, CmsModelGroupError>>;
}

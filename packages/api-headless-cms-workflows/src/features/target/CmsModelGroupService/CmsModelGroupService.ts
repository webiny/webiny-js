import { Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ListGroupsUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/ListGroups/index.js";
import { GroupNotFoundError } from "@webiny/api-headless-cms/domain/contentModelGroup/errors.js";
import { CmsModelGroupService as Abstraction } from "./abstractions.js";

class CmsModelGroupServiceImpl implements Abstraction.Interface {
    public constructor(private listGroups: ListGroupsUseCase.Interface) {}

    public async getGroup(model: CmsModel): Abstraction.Return {
        const groups = await this.listGroups.execute();
        if (groups.isFail()) {
            return Result.fail(groups.error);
        }
        const group = groups.value.find(item => item.slug === model.group);
        if (!group) {
            return Result.fail(new GroupNotFoundError(model.group));
        }
        return Result.ok(group);
    }
}

export const CmsModelGroupService = Abstraction.createImplementation({
    implementation: CmsModelGroupServiceImpl,
    dependencies: [ListGroupsUseCase]
});

import type { Container } from "@webiny/di";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { CmsModelGroupService } from "~/features/target/CmsModelGroupService/index.js";

/** The group slug of every model group read. Clear it in `beforeEach`. */
export const groupReads: string[] = [];

class RecordingModelGroups implements CmsModelGroupService.Interface {
    public constructor(private decoratee: CmsModelGroupService.Interface) {}

    public async getGroup(model: CmsModel): CmsModelGroupService.Return {
        groupReads.push(model.group);
        return this.decoratee.getGroup(model);
    }
}

/** Records every model group read in `groupReads` (`legacyPlugins`). */
export const recordGroupReads = (container: Container) => {
    container.registerDecorator(
        CmsModelGroupService.createDecorator({ decorator: RecordingModelGroups, dependencies: [] })
    );
};

import type { Container } from "@webiny/di";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";

/** The group id of every group read. Clear it in `beforeEach`. */
export const groupReads: string[] = [];

class RecordingGetGroup implements GetGroupUseCase.Interface {
    public constructor(private decoratee: GetGroupUseCase.Interface) {}

    public async execute(groupId: string): GetGroupUseCase.Return {
        groupReads.push(groupId);
        return this.decoratee.execute(groupId);
    }
}

/** Records every group read in `groupReads` (`legacyPlugins`). */
export const recordGroupReads = (container: Container) => {
    container.registerDecorator(
        GetGroupUseCase.createDecorator({ decorator: RecordingGetGroup, dependencies: [] })
    );
};

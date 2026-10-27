import type { Container } from "@webiny/di";
import type { CmsModel, CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import { GetLatestEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestEntriesByIds/index.js";

/** The ids of every latest-entries read, one list per call. Clear it in `beforeEach`. */
export const latestEntryReads: string[][] = [];

class RecordingGetLatestEntries implements GetLatestEntriesByIdsUseCase.Interface {
    public constructor(private decoratee: GetLatestEntriesByIdsUseCase.Interface) {}

    public async execute<T extends CmsEntryValues>(
        model: CmsModel,
        ids: string[]
    ): GetLatestEntriesByIdsUseCase.Return<T> {
        latestEntryReads.push([...ids]);
        return this.decoratee.execute<T>(model, ids);
    }
}

/** Records every latest-entries read in `latestEntryReads` (`legacyPlugins`). */
export const recordLatestEntryReads = (container: Container) => {
    container.registerDecorator(
        GetLatestEntriesByIdsUseCase.createDecorator({
            decorator: RecordingGetLatestEntries,
            dependencies: []
        })
    );
};

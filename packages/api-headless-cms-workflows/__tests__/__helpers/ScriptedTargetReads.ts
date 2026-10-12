import type { Container } from "@webiny/di";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";

/** Every target read, as the revision id read. Clear it in `beforeEach`. */
export const targetReads: string[] = [];

/** Revision ids whose read throws. Clear it in `afterEach`. */
export const throwingTargetRevisions = new Set<string>();

class ScriptedCmsEntryTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(
        params: CmsEntryTargetReader.Params
    ): Promise<CmsEntryTargetReader.Target | null> {
        targetReads.push(params.targetRevisionId);
        if (throwingTargetRevisions.has(params.targetRevisionId)) {
            throw new Error("Target read failed.");
        }
        return this.decoratee.read(params);
    }
}

/** Records every target read in `targetReads` and throws for `throwingTargetRevisions`. */
export const scriptTargetReads = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({
            decorator: ScriptedCmsEntryTargetReader,
            dependencies: []
        })
    );
};

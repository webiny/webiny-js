import type { Container } from "@webiny/di";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";

/** Every target read, as the revision id read. Clear it in `beforeEach`. */
export const targetReads: string[] = [];

/** Revision ids whose read throws. Clear it in `afterEach`. */
export const throwingTargetRevisions = new Set<string>();

/** Revision ids that read as missing. Clear it in `afterEach`. */
export const missingTargetRevisions = new Set<string>();

/** Revision ids that read as another entry's revision. Clear it in `afterEach`. */
export const mismatchedTargetRevisions = new Set<string>();

class ScriptedCmsEntryTargetReader implements CmsEntryTargetReader.Interface {
    public constructor(private decoratee: CmsEntryTargetReader.Interface) {}

    public async read(
        params: CmsEntryTargetReader.Params
    ): Promise<CmsEntryTargetReader.Target | null> {
        targetReads.push(params.targetRevisionId);
        if (throwingTargetRevisions.has(params.targetRevisionId)) {
            throw new Error("Target read failed.");
        }
        if (missingTargetRevisions.has(params.targetRevisionId)) {
            return null;
        }
        const target = await this.decoratee.read(params);
        if (target && mismatchedTargetRevisions.has(params.targetRevisionId)) {
            return { ...target, entry: { ...target.entry, entryId: "another-entry" } };
        }
        return target;
    }
}

/**
 * Records every target read in `targetReads`; throws for `throwingTargetRevisions`, returns `null`
 * for `missingTargetRevisions` and another entry id for `mismatchedTargetRevisions`.
 */
export const scriptTargetReads = (container: Container) => {
    container.registerDecorator(
        CmsEntryTargetReader.createDecorator({
            decorator: ScriptedCmsEntryTargetReader,
            dependencies: []
        })
    );
};

import type { Container } from "@webiny/di";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";

/** Every target read, as the revision id read. Clear it in `beforeEach`. */
export const targetReads: string[] = [];

/** Revision ids whose read throws. Clear it in `afterEach`. */
export const throwingTargetRevisions = new Set<string>();

/** Revision ids that read as missing (null). Clear it in `afterEach`. */
export const nullTargetRevisions = new Set<string>();

/** Revision ids that read as another page's revision. Clear it in `afterEach`. */
export const mismatchedTargetRevisions = new Set<string>();

class ScriptedWbPageTargetReader implements WbPageTargetReader.Interface {
    public constructor(private decoratee: WbPageTargetReader.Interface) {}

    public async read(
        params: WbPageTargetReader.Params
    ): Promise<WbPageTargetReader.Target | null> {
        targetReads.push(params.targetRevisionId);
        if (throwingTargetRevisions.has(params.targetRevisionId)) {
            throw new Error("Target read failed.");
        }
        if (nullTargetRevisions.has(params.targetRevisionId)) {
            return null;
        }
        const target = await this.decoratee.read(params);
        if (target && mismatchedTargetRevisions.has(params.targetRevisionId)) {
            return { ...target, page: { ...target.page, entryId: "another-page" } };
        }
        return target;
    }
}

/**
 * Records every target read in `targetReads`; throws for `throwingTargetRevisions`, returns null for `nullTargetRevisions` and returns
 * another page id for `mismatchedTargetRevisions`.
 */
export const scriptTargetReads = (container: Container) => {
    container.registerDecorator(
        WbPageTargetReader.createDecorator({
            decorator: ScriptedWbPageTargetReader,
            dependencies: []
        })
    );
};

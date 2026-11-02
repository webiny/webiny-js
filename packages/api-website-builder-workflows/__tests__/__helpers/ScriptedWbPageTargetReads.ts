import type { Container } from "@webiny/di";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";

/** Every target read, as the revision id read (batch reads too). Clear it in `beforeEach`. */
export const targetReads: string[] = [];

/** Every batch read, as the revision ids read in it. Clear it in `beforeEach`. */
export const targetBatchReads: string[][] = [];

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

    public async readMany(
        params: WbPageTargetReader.ManyParams
    ): Promise<WbPageTargetReader.Target[]> {
        targetReads.push(...params.targetRevisionIds);
        targetBatchReads.push([...params.targetRevisionIds]);
        if (params.targetRevisionIds.some(id => throwingTargetRevisions.has(id))) {
            throw new Error("Target read failed.");
        }
        const targetRevisionIds = params.targetRevisionIds.filter(id => {
            return !nullTargetRevisions.has(id);
        });
        const targets = await this.decoratee.readMany({ ...params, targetRevisionIds });
        return targets.map(target => {
            if (!mismatchedTargetRevisions.has(target.page.id)) {
                return target;
            }
            return { ...target, page: { ...target.page, entryId: "another-page" } };
        });
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

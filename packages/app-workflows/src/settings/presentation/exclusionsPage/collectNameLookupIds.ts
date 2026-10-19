import type { WorkflowExclusion } from "~/settings/domain/types.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";

/*
 * The distinct user ids of the list the page still has to name (R321): no name yet, or still
 * `unknown` after a failed lookup. Found and deleted users are never asked again.
 */
export const collectNameLookupIds = (
    list: WorkflowExclusion[],
    known: ReadonlyMap<string, ExclusionUserName>
): string[] => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const exclusion of list) {
        const userId = exclusion.userId;
        if (seen.has(userId)) {
            continue;
        }
        seen.add(userId);
        const name = known.get(userId);
        if (name !== undefined && name.state !== "unknown") {
            continue;
        }
        ids.push(userId);
    }
    return ids;
};

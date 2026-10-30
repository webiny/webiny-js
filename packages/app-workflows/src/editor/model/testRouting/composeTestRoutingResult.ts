import type { RoutingInspection } from "~/editor/domain/types.js";
import { composeReasonLine } from "./composeReasonLine.js";
import { composeSkippedPeople } from "./composeSkippedPeople.js";
import { composeStrategyLine } from "./composeStrategyLine.js";
import { composeTraceRows } from "./composeTraceRows.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingResultVm } from "./TestRoutingResultVm.js";

const TEAM_POOL = "Team pool";

/*
 * The Test routing result as the design words it (R301), composed from the server's inspection,
 * the rules of the request and the resolved names. Pure; every sentence comes from data.
 */
export const composeTestRoutingResult = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingResultVm => {
    const owner = inspection.owner;
    const ownerLabel = owner === null ? TEAM_POOL : owner.displayName;
    const ownerIcon: TestRoutingResultVm["ownerIcon"] = owner === null ? "groups" : "person";

    return {
        ownerLabel,
        ownerIcon,
        reason: composeReasonLine(inspection, context),
        trace: composeTraceRows(inspection, context),
        strategyLine: composeStrategyLine(inspection, context),
        skipped: composeSkippedPeople(inspection, context)
    };
};

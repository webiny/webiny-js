import type { RoutingInspection } from "~/editor/domain/types.js";
import { getInspectionUserName } from "./getInspectionUserName.js";
import type { TestRoutingContext } from "./TestRoutingContext.js";
import type { TestRoutingSkippedVm } from "./TestRoutingResultVm.js";

// The people routing skipped, with the server's reason verbatim (R301, copy gap 4 for the name).
export const composeSkippedPeople = (
    inspection: RoutingInspection,
    context: TestRoutingContext
): TestRoutingSkippedVm[] => {
    return inspection.skipped.map(person => {
        let name = getInspectionUserName(person.userId, context);
        if (person.displayName !== null) {
            name = person.displayName;
        }

        return { name, reason: person.reason };
    });
};

import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { createExclusion } from "./settingsFixtures.js";

// 2026-10-19 12:00 in Zagreb: Ana's and Ben's exclusions are active, Cid's has expired.
export const EXCLUSIONS_NOW = Date.parse("2026-10-19T10:00:00.000Z");

export const ZAGREB = "Europe/Zagreb";

export const NEW_YORK = "America/New_York";

export const TOKYO = "Asia/Tokyo";

// Until the end of 20 Oct 2026 in Zagreb (23:59:59.999 CEST).
export const createAnaExclusion = (): WorkflowExclusion => {
    return createExclusion({
        userId: "user-ana",
        reason: "On leave",
        endsOn: "2026-10-20T21:59:59.999Z"
    });
};

// Until removed, without a reason.
export const createBenExclusion = (): WorkflowExclusion => {
    return createExclusion({ userId: "user-ben", reason: null, endsOn: null });
};

// Ended with 10 Oct 2026 in Zagreb.
export const createCidExclusion = (): WorkflowExclusion => {
    return createExclusion({
        userId: "user-cid",
        reason: "Workload",
        endsOn: "2026-10-10T21:59:59.999Z"
    });
};

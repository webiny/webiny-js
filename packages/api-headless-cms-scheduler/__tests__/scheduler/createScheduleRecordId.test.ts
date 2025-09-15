import { describe, expect, it } from "vitest";
import {
    createScheduleRecordId,
    createScheduleRecordIdWithVersion
} from "~/scheduler/createScheduleRecordId.js";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";

describe("createScheduleRecordId", () => {
    it("should create a valid schedule record ID with version", () => {
        const result = createScheduleRecordIdWithVersion("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001#0001`);
    });

    it("should create a valid schedule record ID from already created record ID with version", () => {
        const result = createScheduleRecordIdWithVersion("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001#0001`);

        const rerunResult = createScheduleRecordIdWithVersion(result);

        expect(rerunResult).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001#0001`);
    });

    it("should create a valid schedule record ID without version", () => {
        const result = createScheduleRecordId("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001`);
    });

    it("should create a valid schedule record ID from already created record ID without version", () => {
        const result = createScheduleRecordId("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001`);

        const rerunResult = createScheduleRecordId(result);

        expect(rerunResult).toEqual(`${SCHEDULE_ID_PREFIX}target-id-0001`);
    });
});

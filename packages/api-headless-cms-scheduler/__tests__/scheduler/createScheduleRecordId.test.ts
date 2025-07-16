import { createScheduleRecordId } from "~/scheduler/createScheduleRecordId.js";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";

describe("createScheduleRecordId", () => {
    it("should create a valid schedule record ID", () => {
        const result = createScheduleRecordId("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-1`);
    });

    it("should create a valid schedule record ID from already created record ID", () => {
        const result = createScheduleRecordId("target-id#0001");

        expect(result).toEqual(`${SCHEDULE_ID_PREFIX}target-id-1`);

        const rerunResult = createScheduleRecordId(result);

        expect(rerunResult).toEqual(`${SCHEDULE_ID_PREFIX}target-id-1`);
    });
});

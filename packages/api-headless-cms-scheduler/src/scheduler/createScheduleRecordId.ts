import { parseIdentifier } from "@webiny/utils";
import { SCHEDULE_ID_PREFIX } from "~/constants";

export const createScheduleRecordId = (input: string): string => {
    /**
     * A possibility that the input is already a schedule record ID?
     */
    if (input.includes(SCHEDULE_ID_PREFIX)) {
        return input;
    }

    const { id, version } = parseIdentifier(input);
    return `${SCHEDULE_ID_PREFIX}${id}-${version}`;
};

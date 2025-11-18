import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { SCHEDULE_ID_PREFIX } from "~/constants.js";
import { zeroPad } from "@webiny/utils/zeroPad.js";

export const createScheduleRecordIdWithVersion = (input: string): string => {
    const recordId = createScheduleRecordId(input);
    const { id } = parseIdentifier(recordId);

    return `${id}#0001`;
};

export const createScheduleRecordId = (input: string): string => {
    /**
     * A possibility that the input is already a schedule record ID?
     */
    if (input.includes(SCHEDULE_ID_PREFIX)) {
        return input;
    }

    const { id, version } = parseIdentifier(input);
    return `${SCHEDULE_ID_PREFIX}${id}-${zeroPad(version || 1)}`;
};

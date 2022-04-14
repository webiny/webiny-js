import { ApwContentTypes, ApwScheduleActionData, ApwScheduleActionTypes } from "~/scheduler/types";
import { PUBLISH_PAGE, UNPUBLISH_PAGE } from "./graphql";

export const getGqlBody = (data: ApwScheduleActionData): string => {
    let body = {};

    if (data.type === ApwContentTypes.PAGE) {
        if (data.action === ApwScheduleActionTypes.PUBLISH) {
            body = { query: PUBLISH_PAGE, variables: { id: data.entryId } };
        }
        if (data.action === ApwScheduleActionTypes.UNPUBLISH) {
            body = { query: UNPUBLISH_PAGE, variables: { id: data.entryId } };
        }
    }

    return JSON.stringify(body);
};

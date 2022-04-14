import { ApwContentTypes, ApwScheduleActionData, ApwScheduleActionTypes } from "~/scheduler/types";
import { PUBLISH_PAGE, UNPUBLISH_PAGE } from "./graphql";
import { documentClient } from "~/scheduler/handlers/utils";

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

/**
 * Get APW settings record from DDB.
 */
export interface ApwSettings {
    mainGraphqlFunctionArn: string;
}

export const getApwSettings = async (): Promise<ApwSettings> => {
    const params = {
        TableName: process.env.DB_TABLE as string,
        Key: {
            PK: `APW#SETTINGS`,
            SK: "A"
        }
    };

    const { Item } = await documentClient.get(params).promise();

    return {
        mainGraphqlFunctionArn: Item ? Item["mainGraphqlFunctionArn"] : "mainGraphqlFunctionArn"
    };
};

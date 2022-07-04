import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import dynamoDbPlugins from "@webiny/db-dynamodb/plugins";
import logsPlugins from "@webiny/handler-logs";
import { InvocationTypes } from "~/scheduler/types";

/**
 * https://day.js.org/docs/en/plugin/utc
 */
dayjs.extend(utc);

const TIME_SEPARATOR = ":";
const ELAPSED_CRON_EXPRESSION = "* * * * ? 2000";

export const getIsoStringTillMinutes = (datetime: string): string => {
    /**
     * Validate datetime.
     */
    if (isNaN(Date.parse(datetime))) {
        return datetime;
    }
    // input = "2022-03-08T05:41:13.230Z"
    // output = "2022-03-08T05:41"
    return datetime.slice(0, datetime.lastIndexOf(TIME_SEPARATOR));
};

export const dateTimeToCronExpression = (datetime: string): string => {
    if (!datetime) {
        return ELAPSED_CRON_EXPRESSION;
    }
    /**
     * You can't specify the Day-of-month and Day-of-week fields in the same cron expression.
     * If you specify a value (or a *) in one of the fields, you must use a ? (question mark) in the other.
     *
     *  https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/ScheduledEvents.html
     */
    const dayOfWeek = "?";

    return dayjs.utc(datetime).format(`mm H D M [${dayOfWeek}] YYYY`);
};

export const moveDateTimeToNextCentury = (datetime: string): string => {
    return dayjs.utc(datetime).add(100, "year").toISOString();
};

export const moveDateTimeToCurrentCentury = (datetime: string): string => {
    return dayjs.utc(datetime).subtract(100, "year").toISOString();
};

export const isDateTimeInNextCentury = (datetime: string): boolean => {
    return dayjs.utc(datetime).isAfter("2100-01-01", "year");
};

interface ShouldRestoreDatetimeParams {
    invocationType?: InvocationTypes;
    datetime: string;
}

export const shouldRestoreDatetime = ({
    invocationType,
    datetime
}: ShouldRestoreDatetimeParams): boolean => {
    /**
     * "invocationType" will not be SCHEDULED when the lambda is called from Main GQL handler.
     *
     * Which means a new content is scheduled for "publish"/"unpublish" therefore, we need to restore the previously
     * scheduled action if it has not been executed already.
     */
    const selfInvoked = invocationType === InvocationTypes.SCHEDULED;

    const today = dayjs.utc();
    const isExecutionPending = dayjs.utc(datetime).isAfter(today);

    return !selfInvoked && isExecutionPending;
};

interface EncodeTokenParams {
    id: string;
    tenant: string;
    locale: string;
}

export const encodeToken = ({ id, tenant, locale }: EncodeTokenParams) => {
    return `${TOKEN_PREFIX}${id}__${tenant}__${locale}`;
};

export const TOKEN_PREFIX = "apw-";

export const decodeToken = (token: string): Partial<EncodeTokenParams> => {
    const auth = token.slice(TOKEN_PREFIX.length);
    const [id, tenant, locale] = auth.split("__");

    return {
        id,
        tenant,
        locale
    };
};

export const documentClient = new DocumentClient({
    convertEmptyValues: true,
    region: process.env.AWS_REGION
});

export const basePlugins = () => [
    dynamoDbPlugins(),
    logsPlugins(),
    dbPlugins({
        table: process.env.DB_TABLE,
        driver: new DynamoDbDriver({
            documentClient
        })
    })
];

/**
 * Get APW settings record from DDB.
 */
export interface ApwSettings {
    mainGraphqlFunctionArn: string;
    cmsGraphqlFunctionArn: string;
    eventRuleName: string;
    eventTargetId: string;
}

export const getApwSettings = async (): Promise<ApwSettings> => {
    const variant = process.env.STAGED_ROLLOUTS_VARIANT;

    const params = {
        TableName: process.env.DB_TABLE as string,
        Key: {
            PK: `APW#SETTINGS`,
            SK: variant || "default"
        }
    };

    const { Item } = await documentClient.get(params).promise();

    return {
        mainGraphqlFunctionArn: Item ? Item["mainGraphqlFunctionArn"] : "mainGraphqlFunctionArn",
        cmsGraphqlFunctionArn: Item ? Item["cmsGraphqlFunctionArn"] : "cmsGraphqlFunctionArn",
        eventRuleName: Item ? Item["eventRuleName"] : "eventRuleName",
        eventTargetId: Item ? Item["eventTargetId"] : "eventTargetId"
    };
};

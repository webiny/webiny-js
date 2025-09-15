export {
    CloudWatchEventsClient,
    DeleteRuleCommand,
    RemoveTargetsCommand,
    PutRuleCommand,
    PutTargetsCommand
} from "@aws-sdk/client-cloudwatch-events";
export type { PutRuleCommandInput } from "@aws-sdk/client-cloudwatch-events";

export { CloudWatchLogs, type GetLogEventsRequest } from "@aws-sdk/client-cloudwatch-logs";

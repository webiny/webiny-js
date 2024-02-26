import { CloudWatchLogs, GetLogEventsRequest } from "@webiny/aws-sdk/client-cloudwatch";

const cache = new Map<string, LogStream>();

export class LogStream {
    private readonly logGroupName: string;
    private readonly logStreamName: string;
    private readonly cloudWatchLogs: CloudWatchLogs;
    private nextPage: string | undefined;

    private constructor(logGroupName: string, logStreamName: string) {
        this.logGroupName = logGroupName;
        this.logStreamName = logStreamName;
        this.cloudWatchLogs = new CloudWatchLogs();
    }

    getLogStreamLink() {
        const replacements = [
            [/\$/g, "$2524"],
            [/\//g, "$252F"],
            [/\[/g, "$255B"],
            [/]/g, "$255D"]
        ];

        const replacer = (value: string, replacement: (string | RegExp)[]) => {
            return value.replace(replacement[0], replacement[1] as string);
        };

        return [
            `https://${process.env.AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${process.env.AWS_REGION}#logsV2:log-groups/log-group/`,
            replacements.reduce(replacer, this.logGroupName),
            "/log-events/",
            replacements.reduce(replacer, this.logStreamName)
        ].join("");
    }

    async printLogsSince(startTime: number): Promise<void> {
        const params: GetLogEventsRequest = {
            logStreamName: this.logStreamName,
            logGroupName: this.logGroupName,
            nextToken: this.nextPage,
            startFromHead: true,
            startTime,
            unmask: true
        };

        try {
            const { events, nextForwardToken } = await this.cloudWatchLogs.getLogEvents(params);

            this.nextPage = nextForwardToken;

            if (events) {
                events.forEach(event => {
                    process.stdout.write(String(event.message));
                });
            }
        } catch (err) {
            console.log(`Couldn't fetch logs: ${err.message}`);
        }
    }

    public static create(logGroupName: string, logStreamName: string) {
        const cacheId = `${logGroupName}:${logStreamName}`;

        if (cache.has(cacheId)) {
            return cache.get(cacheId) as LogStream;
        }

        const logStream = new LogStream(logGroupName, logStreamName);
        cache.set(cacheId, logStream);

        return logStream;
    }
}

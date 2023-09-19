import { LogStream } from "./LogStream";

export class LogReporter {
    private readonly logGroupName: string;
    private readonly logsCreatedSince: number;
    private readonly logStreams = new Set<LogStream>();

    constructor(functionName: string) {
        const baseName = functionName.split(":").pop();
        this.logGroupName = `/aws/lambda/${baseName}`;
        this.logsCreatedSince = Date.now();
    }

    public async printLogs(logStreamName: string) {
        const logStream = this.initializeStream(logStreamName);
        await logStream.printLogsSince(this.logsCreatedSince);
    }

    public printLogStreamLinks() {
        if (this.logStreams.size === 0) {
            return;
        }

        const logStreams = Array.from(this.logStreams);

        if (this.logStreams.size === 1) {
            process.stdout.write(
                `\nTo view detailed logs, visit the following AWS CloudWatch log stream:\n`
            );
            process.stdout.write(logStreams[0].getLogStreamLink());
        } else {
            process.stdout.write(
                `\nTo view detailed logs, visit the following AWS CloudWatch log streams:\n`
            );

            for (const logStream of logStreams) {
                process.stdout.write(`- ${logStream.getLogStreamLink()}`);
            }
        }

        process.stdout.write("\n");
    }

    public initializeStream(name: string) {
        const logStream = LogStream.create(this.logGroupName, name);
        this.logStreams.add(logStream);
        return logStream;
    }
}

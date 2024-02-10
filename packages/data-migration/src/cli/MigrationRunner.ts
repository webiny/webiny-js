import { InvokeCommand, LambdaClient } from "@webiny/aws-sdk/client-lambda";
import { MigrationStatusReporter } from "~/cli/MigrationStatusReporter";
import {
    MigrationEventHandlerResponse,
    MigrationInvocationErrorResponse,
    MigrationStatus,
    MigrationStatusResponse
} from "~/types";
import { executeWithRetry } from "@webiny/utils";
import { VoidStatusReporter } from "./VoidStatusReporter";

interface MigrationRunnerConfig {
    lambdaClient: LambdaClient;
    functionName: string;
    statusReporter?: MigrationStatusReporter;
}

interface MigrationPayload {
    version: string;
    pattern?: string;
    force?: boolean;
}

interface SuccessResultHandler {
    (result: MigrationStatusResponse["data"]): void | Promise<void>;
}

interface ErrorResultHandler {
    (error: MigrationInvocationErrorResponse["error"]): void | Promise<void>;
}

export class MigrationRunnerResult {
    private readonly functionName: string;
    private readonly result: MigrationStatusResponse | MigrationInvocationErrorResponse;
    private readonly successBranch: SuccessResultHandler[] = [];
    private readonly errorBranch: ErrorResultHandler[] = [];

    constructor(
        functionName: string,
        result: MigrationStatusResponse | MigrationInvocationErrorResponse
    ) {
        this.functionName = functionName;
        this.result = result;
    }

    getFunctionName() {
        return this.functionName;
    }

    onSuccess(cb: SuccessResultHandler) {
        this.successBranch.push(cb);
    }

    onError(cb: ErrorResultHandler) {
        this.errorBranch.push(cb);
    }

    async process(): Promise<void> {
        if (this.result.error) {
            for (const handler of this.errorBranch) {
                await handler(this.result.error);
            }
            return;
        }

        for (const handler of this.successBranch) {
            await handler(this.result.data);
        }
    }
}

export class MigrationRunner {
    private readonly lambdaClient: LambdaClient;
    private readonly functionName: string;
    private statusReporter: MigrationStatusReporter = new VoidStatusReporter();

    public static create(params: MigrationRunnerConfig) {
        const runner = new MigrationRunner(params.lambdaClient, params.functionName);
        if (params.statusReporter) {
            runner.setStatusReporter(params.statusReporter);
        }
        return runner;
    }

    private constructor(lambdaClient: LambdaClient, functionName: string) {
        this.lambdaClient = lambdaClient;
        this.functionName = functionName;
    }

    public setStatusReporter(reporter: MigrationStatusReporter) {
        this.statusReporter = reporter;
    }

    async runMigration(payload: MigrationPayload): Promise<MigrationRunnerResult> {
        // Execute migration function.
        await this.invokeMigration(payload);

        // Poll for status and re-execute when migration is in "pending" state.
        let response: MigrationEventHandlerResponse;

        while (true) {
            await new Promise(resolve =>
                setTimeout(resolve, this.getMigrationStatusReportInterval())
            );

            response = await this.getStatus(payload);

            if (!response) {
                continue;
            }

            const { data, error } = response;

            // If we received an error, it must be an unrecoverable error, and we don't retry.
            if (error) {
                return this.getResult(response);
            }

            switch (data.status) {
                case "init":
                    await this.reportStatus(data);
                    continue;
                case "pending":
                    await this.invokeMigration(payload);
                    break;
                case "running":
                    await this.reportStatus(data);
                    break;
                case "done":
                    await this.reportStatus(data);
                    return this.getResult(response);
                default:
                    return this.getResult(response);
            }
        }
    }

    private async reportStatus(data: MigrationStatus) {
        await this.statusReporter.report(data);
    }

    private async invokeMigration(payload: MigrationPayload) {
        const response = await this.lambdaClient.send(
            new InvokeCommand({
                FunctionName: this.functionName,
                InvocationType: "Event",
                Payload: JSON.stringify({ ...payload, command: "execute" })
            })
        );

        return response.StatusCode;
    }

    private getResult(response: MigrationStatusResponse | MigrationInvocationErrorResponse) {
        return new MigrationRunnerResult(this.functionName, response);
    }

    private async getStatus(payload: Record<string, any>) {
        const getStatus = () => {
            return this.lambdaClient.send(
                new InvokeCommand({
                    FunctionName: this.functionName,
                    InvocationType: "RequestResponse",
                    Payload: JSON.stringify({ ...payload, command: "status" })
                })
            );
        };

        const response = await executeWithRetry(getStatus);

        const decoder = new TextDecoder("utf-8");
        return JSON.parse(decoder.decode(response.Payload)) as MigrationEventHandlerResponse;
    }

    private getMigrationStatusReportInterval() {
        const envKey = "MIGRATION_STATUS_REPORT_INTERVAL";
        if (envKey in process.env) {
            return parseInt(String(process.env[envKey]));
        }
        return 2000;
    }
}

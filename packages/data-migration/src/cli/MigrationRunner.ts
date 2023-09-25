import LambdaClient from "aws-sdk/clients/lambda";
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
        const branch = this.result.error ? this.errorBranch : this.successBranch;
        const input = this.result.error ? this.result.error : this.result.data;

        for (const handler of branch) {
            await handler(input as any);
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
        const response = await this.lambdaClient
            .invoke({
                FunctionName: this.functionName,
                InvocationType: "Event",
                Payload: JSON.stringify({ ...payload, command: "execute" })
            })
            .promise();

        return response.StatusCode;
    }

    private getResult(response: MigrationStatusResponse | MigrationInvocationErrorResponse) {
        return new MigrationRunnerResult(this.functionName, response);
    }

    private async getStatus(payload: Record<string, any>) {
        const getStatus = () => {
            return this.lambdaClient
                .invoke({
                    FunctionName: this.functionName,
                    InvocationType: "RequestResponse",
                    Payload: JSON.stringify({ ...payload, command: "status" })
                })
                .promise();
        };

        const response = await executeWithRetry(getStatus);

        return JSON.parse(response.Payload as string) as MigrationEventHandlerResponse;
    }

    private getMigrationStatusReportInterval() {
        const envKey = "MIGRATION_STATUS_REPORT_INTERVAL";
        if (envKey in process.env) {
            return parseInt(String(process.env[envKey]));
        }
        return 2000;
    }
}

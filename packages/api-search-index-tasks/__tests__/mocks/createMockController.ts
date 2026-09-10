import type { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/abstractions.js";

export interface IMockControllerOptions {
    input?: Record<string, any>;
    isCloseToTimeout?: () => boolean;
    isAborted?: () => boolean;
}

export const createMockController = (options: IMockControllerOptions = {}) => {
    let input = options.input || {};
    const logs: Array<{ type: string; message: string; data?: any }> = [];

    const controller: TaskController.Interface = {
        response: {
            done: (message?: string, output?: any) => ({
                status: TaskResultStatus.DONE as const,
                message,
                output
            }),
            continue: (continueInput: any) => ({
                status: TaskResultStatus.CONTINUE as const,
                input: { ...input, ...continueInput }
            }),
            aborted: () => ({
                status: TaskResultStatus.ABORTED as const
            }),
            error: (error: any) => ({
                status: TaskResultStatus.ERROR as const,
                error: {
                    message: error.message || String(error),
                    code: error.code,
                    data: error.data
                }
            })
        },
        state: {
            getTask: () => ({}) as any,
            getStatus: () => "running" as any,
            getInput: () => input as any,
            getOutput: () => undefined,
            updateInput: async (partial: any) => {
                input = { ...input, ...partial };
            },
            updateOutput: async () => {}
        },
        logger: {
            info: async (params: { message: string; data?: any }) => {
                logs.push({ type: "info", ...params });
            },
            error: async (params: { message: string; error?: any; data?: any }) => {
                logs.push({ type: "error", ...params });
            }
        },
        task: {
            trigger: async () => ({}) as any,
            listChildren: async () => []
        },
        runtime: {
            isCloseToTimeout: options.isCloseToTimeout || (() => false),
            isAborted: options.isAborted || (() => false),
            getRemainingSeconds: () => 300,
            getRemainingMilliseconds: () => 300000
        }
    } as any;

    return { controller, logs, getInput: () => input };
};

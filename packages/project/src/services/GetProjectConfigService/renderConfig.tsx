import { fork } from "child_process";
import path from "path";
import { deserializeError } from "serialize-error";
import {
    type IProjectConfigDto,
    type IProjectModel,
    type IProjectModelDto
} from "~/abstractions/models/index.js";
import { type ProjectSdkParamsService } from "~/abstractions/index.js";
import { serializeProjectSdkContext, WBY_PROJECT_SDK_CONTEXT } from "~/utils/index.js";

export interface RenderConfigParams {
    project: IProjectModel;
    args?: Record<string, any>;
    sdkParams: ProjectSdkParamsService.Params;
}

export interface RenderConfigParamsDto {
    project: IProjectModelDto;
    args?: Record<string, any>;
}

export interface RenderConfigWorkerMessageDto {
    type: "error" | "success";
    error: Record<string, any> | null;
    data: IProjectConfigDto | null;
}

const getWorkerPath = () => {
    // TODO: I have no idea why import.meta.dirname is sometimes undefined.
    // TODO: Would be nice to further investigate this, but don't have time right now.
    return path.join(import.meta.dirname || __dirname, "renderConfigWorker.js");
};

export async function renderConfig(params: RenderConfigParams) {
    // Initially, I did the reading of config in this file directly. But then I started
    // bumping into an issue, where for some reason, the `Properties` context would not work.
    // Basically, `useProperties` would throw an error message, saying that the `Properties`
    // context is not available. So, I decided to move the reading of config into a separate
    // worker file, which is then executed in a child process.
    // This works. Why the context is not available in the main process, I have no idea.
    // I tried multiple things, but nothing worked. Lost more than a day on this.
    // Decided to move on, as this works and I don't have time to investigate this further.
    return new Promise<IProjectConfigDto>((resolve, reject) => {
        const workerPath = getWorkerPath();

        const args = [
            JSON.stringify({
                project: params.project.toDto(),
                args: params.args || {}
            })
        ];

        const childProcess = fork(workerPath, args, {
            stdio: ["pipe", "pipe", "pipe", "ipc"],
            env: {
                ...process.env,
                [WBY_PROJECT_SDK_CONTEXT]: serializeProjectSdkContext(params.sdkParams)
            }
        });

        // The only message we expect to receive is the parsed project config.
        childProcess.on("message", (message: RenderConfigWorkerMessageDto) => {
            if (message.type === "error") {
                const error = deserializeError(message.error);
                return reject(error);
            }

            return resolve(message.data!);
        });
    });
}

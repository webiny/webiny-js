import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import type { IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import type { IProjectModel } from "@webiny/project/abstractions/models/index.js";
import { registerAwsProjectFeatures } from "~/registerAwsProjectFeatures.js";
import { AwsDeployInitHostingSdkService } from "~/services/AwsDeployInitHostingSdkService/AwsDeployInitHostingSdkService.js";
import { deployAppWithHooks } from "~/decorators/DeployAppWithHooks.js";
import { deployAppWithWatchedLambdaReplacement } from "~/decorators/DeployAppWithWatchedLambdaReplacement.js";
import { deployAppClearWatchedLambdaFunctions } from "~/decorators/DeployAppClearWatchedLambdaFunctions.js";
import { deployAppRefreshStackOutputCache } from "~/decorators/DeployAppRefreshStackOutputCache.js";
import { destroyAppClearStackOutputCache } from "~/decorators/DestroyAppClearStackOutputCache.js";
import { getPulumiServiceWithDownloadInfo } from "~/decorators/GetPulumiServiceWithDownloadInfo.js";

const noExtensions = { extensionsByType: () => [] } as unknown as IProjectConfigModel;
const project = {} as IProjectModel;

describe("deploy decorators", () => {
    /*
     * The container wraps once per registration, so a second registration of
     * `deployAppWithHooks` would run every deploy hook twice.
     */
    it("are registered once in the CLI container", async () => {
        const container = new Container();
        const registrations = new Map<unknown, number>();
        const registerDecorator = container.registerDecorator.bind(container);
        container.registerDecorator = (
            decorator: Parameters<Container["registerDecorator"]>[0]
        ) => {
            const count = registrations.get(decorator) ?? 0;
            registrations.set(decorator, count + 1);
            return registerDecorator(decorator);
        };

        registerAwsProjectFeatures(container);
        await new AwsDeployInitHostingSdkService().execute({
            container,
            projectExtensions: noExtensions,
            project
        });

        const decorators = [
            deployAppWithHooks,
            deployAppWithWatchedLambdaReplacement,
            deployAppClearWatchedLambdaFunctions,
            deployAppRefreshStackOutputCache,
            destroyAppClearStackOutputCache,
            getPulumiServiceWithDownloadInfo
        ];
        const counts = decorators.map(decorator => registrations.get(decorator));
        expect(counts).toEqual([1, 1, 1, 1, 1, 1]);
    });
});

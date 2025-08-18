import { getProject } from "@webiny/cli/utils";
import { mapStackOutput } from "./mapStackOutput";
import execa from "execa";

const cache: Record<string, any> = {};

export interface IGetOutputJsonParams {
    folder: string;
    env: string;
    cwd?: string | undefined;
    variant: string | undefined;
    skipCache?: boolean;
}

const getOutputJson = (params: IGetOutputJsonParams) => {
    const { folder, env, cwd, variant } = params;
    const project = getProject();

    const cacheKey = [folder, env, variant].filter(Boolean).join("_");

    const skipCache = params.skipCache === true;

    if (cache[cacheKey] && !skipCache) {
        return structuredClone(cache[cacheKey]);
    }

    try {
        const command: string[] = [
            "webiny",
            "output",
            folder,
            "--env",
            env,
            "--json",
            "--no-debug"
        ];
        if (variant) {
            command.push("--variant", variant);
        }

        const { stdout } = execa.sync("yarn", command, {
            cwd: cwd || project.root
        });

        // Let's get the output after the first line break. Everything before is just yarn stuff.
        const extractedJSON = stdout.substring(stdout.indexOf("{"));
        const parsed = JSON.parse(extractedJSON);
        if (Object.keys(parsed).length === 0) {
            return null;
        }
        cache[cacheKey] = parsed;
        return structuredClone(cache[cacheKey]);
    } catch {
        return null;
    }
};

export interface IGetStackOutputParams {
    folder: string;
    env: string;
    variant: string | undefined;
    cwd?: string;
    map?: Record<string, any>;
    skipCache?: boolean;
}

export interface IStackOutput {
    /**
     * There is a possibility for a user to add stuff to the stack output.
     */
    [key: string]: string | string[] | undefined | number | number[] | boolean;
}

export interface IDefaultStackOutput extends IStackOutput {
    deploymentId: string;
    region: string;
    dynamoDbTable: string;
    migrationLambdaArn: string;
    iotAuthorizerName: string;
    apiDomain: string;
    apiUrl: string;
    graphqlLambdaRole: string;
    graphqlLambdaRoleName: string;
    fileManagerManageLambdaArn: string;
    fileManagerManageLambdaRole: string;
    fileManagerManageLambdaRoleName: string;
    apwSchedulerEventRule: string | undefined;
    apwSchedulerEventTargetId: string | undefined;
    apwSchedulerExecuteAction: string | undefined;
    apwSchedulerScheduleAction: string | undefined;
    cognitoUserPoolArn: string;
    cognitoAppClientId: string;
    cognitoUserPoolId: string;
    cognitoUserPoolPasswordPolicy: string;
    websocketApiUrl: string;
    fileManagerBucketId: string;
    fileManagerBucketArn: string;
    primaryDynamodbTableArn: string;
    primaryDynamodbTableName: string;
    primaryDynamodbTableHashKey: string;
    primaryDynamodbTableRangeKey: string;
    logDynamodbTableArn: string;
    logDynamodbTableName: string;
    logDynamodbTableHashKey: string;
    logDynamodbTableRangeKey: string;
    eventBusName: string;
    eventBusArn: string;
    vpcPublicSubnetIds: string[] | undefined;
    vpcPrivateSubnetIds: string[] | undefined;
    vpcSecurityGroupIds: string[] | undefined;
    elasticsearchDomainArn: string | undefined;
    elasticsearchDomainEndpoint: string | undefined;
    elasticsearchDynamodbTableHashKey: string;
    elasticsearchDynamodbTableRangeKey: string;
    elasticsearchDynamodbTableArn: string | undefined;
    elasticsearchDynamodbTableName: string | undefined;
    appStorage: string;
    websiteRouterOriginRequestFunction?: string;
    appDomain?: string;
    deliveryDomain?: string;
}

export const getStackOutput = <T extends IStackOutput = IDefaultStackOutput>(
    folderOrArgs: IGetStackOutputParams | string,
    env?: string,
    map?: Record<string, any>
): T => {
    if (!folderOrArgs) {
        throw new Error("Missing initial argument.");
    }

    // Normalize arguments.
    let args: Partial<IGetStackOutputParams> = {};
    if (typeof folderOrArgs === "string") {
        args = {
            folder: folderOrArgs,
            env: env as string,
            map: map
        };
    } else {
        args = folderOrArgs;
    }

    if (!args.folder) {
        throw new Error(`Please specify a project application folder, for example "admin".`);
    }

    if (!args.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const output = getOutputJson({
        folder: args.folder,
        env: args.env,
        variant: args.variant,
        cwd: args.cwd,
        skipCache: args.skipCache
    });
    if (!output) {
        return output;
    }

    if (!args.map) {
        return output;
    }

    return mapStackOutput<T>(output, args.map);
};

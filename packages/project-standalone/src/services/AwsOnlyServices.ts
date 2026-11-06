import {
    AdminStackOutputService,
    ApiGqlClient,
    ApiStackOutputService,
    CoreStackOutputService,
    InvokeLambdaFunction
} from "@webiny/project/abstractions/aws/index.js";

/*
 * `webiny/infra` exports these AWS services in every project, so a standalone extension can
 * import them. Only `@webiny/project-aws` implements them; without these registrations a hook
 * that depends on one fails with "No registration found for ApiStackOutputService". These say
 * which hosting type the service belongs to instead. They throw when called, not when created,
 * so a hook that depends on one but never calls it in a standalone project still runs.
 */
const awsOnly = (name: string) => {
    return new Error(`"${name}" is only available in AWS projects.`);
};

class StandaloneCoreStackOutput implements CoreStackOutputService.Interface {
    async execute(): Promise<never> {
        throw awsOnly("CoreStackOutput");
    }
}

class StandaloneApiStackOutput implements ApiStackOutputService.Interface {
    async execute(): Promise<never> {
        throw awsOnly("ApiStackOutput");
    }
}

class StandaloneAdminStackOutput implements AdminStackOutputService.Interface {
    async execute(): Promise<never> {
        throw awsOnly("AdminStackOutput");
    }
}

class StandaloneApiGqlClient implements ApiGqlClient.Interface {
    async query(): Promise<never> {
        throw awsOnly("ApiGqlClient");
    }

    async mutation(): Promise<never> {
        throw awsOnly("ApiGqlClient");
    }
}

class StandaloneInvokeLambdaFunction implements InvokeLambdaFunction.Interface {
    async execute(): Promise<never> {
        throw awsOnly("InvokeLambdaFunction");
    }
}

export const StandaloneCoreStackOutputService = CoreStackOutputService.createImplementation({
    implementation: StandaloneCoreStackOutput,
    dependencies: []
});

export const StandaloneApiStackOutputService = ApiStackOutputService.createImplementation({
    implementation: StandaloneApiStackOutput,
    dependencies: []
});

export const StandaloneAdminStackOutputService = AdminStackOutputService.createImplementation({
    implementation: StandaloneAdminStackOutput,
    dependencies: []
});

export const StandaloneApiGqlClientService = ApiGqlClient.createImplementation({
    implementation: StandaloneApiGqlClient,
    dependencies: []
});

export const StandaloneInvokeLambdaFunctionService = InvokeLambdaFunction.createImplementation({
    implementation: StandaloneInvokeLambdaFunction,
    dependencies: []
});

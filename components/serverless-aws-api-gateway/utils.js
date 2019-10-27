const pRetry = require("p-retry");
const { utils } = require("@serverless/core");

const retry = (fn, opts = {}) => {
    return pRetry(
        async () => {
            try {
                return await fn();
            } catch (error) {
                if (error.code !== "TooManyRequestsException") {
                    // Stop retrying and throw the error
                    throw new pRetry.AbortError(error);
                }
                throw error;
            }
        },
        {
            retries: 8,
            minTimeout: 1500,
            factor: 2,
            ...opts
        }
    );
};

const apiExists = async ({ apig, apiId }) => {
    try {
        await apig.getRestApi({ restApiId: apiId }).promise();
        return true;
    } catch (e) {
        if (e.code === "NotFoundException") {
            return false;
        }
        throw Error(e);
    }
};

const createApi = async ({ apig, name, description, endpointTypes, binaryMediaTypes }) => {
    const api = await apig
        .createRestApi({
            name,
            description,
            binaryMediaTypes,
            endpointConfiguration: {
                types: endpointTypes
            }
        })
        .promise();

    return api.id;
};

const getPathId = async ({ apig, apiId, endpoint }) => {
    // todo this called many times to stay up to date. Is it worth the latency?
    const existingEndpoints = (await apig
        .getResources({
            restApiId: apiId
        })
        .promise()).items;

    if (!endpoint) {
        const rootResourceId = existingEndpoints.find(
            existingEndpoint => existingEndpoint.path === "/"
        ).id;
        return rootResourceId;
    }

    const endpointFound = existingEndpoints.find(
        existingEndpoint => existingEndpoint.path === endpoint.path
    );

    return endpointFound ? endpointFound.id : null;
};

const endpointExists = async ({ apig, apiId, endpoint }) => {
    const resourceId = await retry(() => getPathId({ apig, apiId, endpoint }));

    if (!resourceId) {
        return false;
    }

    const params = {
        httpMethod: endpoint.method,
        resourceId,
        restApiId: apiId
    };

    try {
        await retry(() => apig.getMethod(params).promise());
        return true;
    } catch (e) {
        if (e.code === "NotFoundException") {
            return false;
        }
    }
};

const myEndpoint = (state, endpoint) => {
    if (
        state.endpoints &&
        state.endpoints.find(e => e.method === endpoint.method && e.path === endpoint.path)
    ) {
        return true;
    }
    return false;
};

const validateEndpointObject = ({ endpoint, apiId, stage, region }) => {
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "ANY"];

    if (typeof endpoint !== "object") {
        throw Error("endpoint must be an object");
    }

    if (!endpoint.method) {
        throw Error(`missing method property for endpoint "${JSON.stringify(endpoint)}"`);
    }

    if (endpoint.path === "") {
        throw Error(
            `endpoint path cannot be an empty string for endpoint "${JSON.stringify(endpoint)}"`
        );
    }

    if (!endpoint.path) {
        throw Error(`missing path property for endpoint "${JSON.stringify(endpoint)}"`);
    }

    if (typeof endpoint.method !== "string" || typeof endpoint.path !== "string") {
        throw Error(`invalid endpoint "${JSON.stringify(endpoint)}"`);
    }

    if (!validMethods.includes(endpoint.method.toUpperCase())) {
        throw Error(`invalid method for endpoint "${JSON.stringify(endpoint)}"`);
    }

    if (endpoint.path !== "/") {
        if (!endpoint.path.startsWith("/")) {
            endpoint.path = `/${endpoint.path}`;
        }
        if (endpoint.path.endsWith("/")) {
            endpoint.path = endpoint.path.substring(0, endpoint.path.length - 1);
        }
    }

    const validatedEndpoint = {
        url: `https://${apiId}.execute-api.${region}.amazonaws.com/${stage}${endpoint.path}`,
        path: endpoint.path,
        method: endpoint.method.toUpperCase()
    };

    return { ...endpoint, ...validatedEndpoint };
};

const validateEndpoint = async ({ apig, apiId, endpoint, state, stage, region }) => {
    const validatedEndpoint = validateEndpointObject({ endpoint, apiId, stage, region });

    if (await endpointExists({ apig, apiId, endpoint: validatedEndpoint })) {
        if (!myEndpoint(state, validatedEndpoint)) {
            throw Error(
                `endpoint ${validatedEndpoint.method} ${validatedEndpoint.path} already exists in provider`
            );
        }
    }

    return validatedEndpoint;
};

const validateEndpoints = async ({ apig, apiId, endpoints, state, stage, region }) => {
    const promises = [];

    for (const endpoint of endpoints) {
        promises.push(validateEndpoint({ apig, apiId, endpoint, state, stage, region }));
    }

    return Promise.all(promises);
};

const createPath = async ({ apig, apiId, endpoint }) => {
    const pathId = await getPathId({ apig, apiId, endpoint });

    if (pathId) {
        return pathId;
    }

    const pathParts = endpoint.path.split("/");
    const pathPart = pathParts.pop();
    const parentEndpoint = { path: pathParts.join("/") };

    let parentId;
    if (parentEndpoint.path === "") {
        parentId = await getPathId({ apig, apiId });
    } else {
        parentId = await retry(() => createPath({ apig, apiId, endpoint: parentEndpoint }));
    }

    const params = {
        pathPart,
        parentId,
        restApiId: apiId
    };

    const createdPath = await apig.createResource(params).promise();

    return createdPath.id;
};

const createPaths = async ({ apig, apiId, endpoints }) => {
    const createdEndpoints = [];

    for (const endpoint of endpoints) {
        endpoint.id = await retry(() => createPath({ apig, apiId, endpoint }));
        createdEndpoints.push(endpoint);
    }

    return createdEndpoints;
};

const createMethod = async ({ apig, apiId, endpoint }) => {
    const params = {
        authorizationType: "NONE",
        httpMethod: endpoint.method,
        resourceId: endpoint.id,
        restApiId: apiId,
        apiKeyRequired: false
    };

    if (endpoint.authorizerId) {
        params.authorizationType = "CUSTOM";
        params.authorizerId = endpoint.authorizerId;
    }

    try {
        await apig.putMethod(params).promise();
    } catch (e) {
        if (e.code === "ConflictException" && endpoint.authorizerId) {
            // make sure authorizer config are always up to date
            const updateMethodParams = {
                httpMethod: endpoint.method,
                resourceId: endpoint.id,
                restApiId: apiId,
                patchOperations: [
                    {
                        op: "replace",
                        path: "/authorizationType",
                        value: "CUSTOM"
                    },
                    {
                        op: "replace",
                        path: "/authorizerId",
                        value: endpoint.authorizerId
                    }
                ]
            };

            await apig.updateMethod(updateMethodParams).promise();
        } else if (e.code !== "ConflictException") {
            throw Error(e);
        }
    }
};

const createMethods = async ({ apig, apiId, endpoints }) => {
    const promises = [];

    for (const endpoint of endpoints) {
        promises.push(retry(() => createMethod({ apig, apiId, endpoint })));
    }

    await Promise.all(promises);

    return endpoints;
};

const createIntegration = async ({ apig, lambda, apiId, endpoint }) => {
    const isLambda = !!endpoint.function;
    let functionName, accountId, region;

    if (isLambda) {
        functionName = endpoint.function.split(":")[6];
        accountId = endpoint.function.split(":")[4];
        region = endpoint.function.split(":")[3]; // todo what if the lambda in another region?
    }

    const integrationParams = {
        httpMethod: endpoint.method,
        resourceId: endpoint.id,
        restApiId: apiId,
        type: isLambda ? "AWS_PROXY" : "HTTP_PROXY",
        integrationHttpMethod: "POST",
        uri: isLambda
            ? `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${endpoint.function}/invocations`
            : endpoint.proxyURI
    };

    try {
        await apig.putIntegration(integrationParams).promise();
    } catch (e) {
        if (e.code === "ConflictException") {
            // this usually happens when there are too many endpoints for
            // the same function. Retrying after couple of seconds ensures
            // any pending integration requests are resolved.
            await utils.sleep(2000);
            return createIntegration({ apig, lambda, apiId, endpoint });
        }
        throw Error(e);
    }

    // Create lambda trigger for AWS_PROXY endpoints
    if (isLambda) {
        const permissionsParams = {
            Action: "lambda:InvokeFunction",
            FunctionName: functionName,
            Principal: "apigateway.amazonaws.com",
            SourceArn: `arn:aws:execute-api:${region}:${accountId}:${apiId}/*/*`,
            StatementId: `${functionName}-${apiId}`
        };

        try {
            await lambda.addPermission(permissionsParams).promise();
        } catch (e) {
            if (e.code !== "ResourceConflictException") {
                throw Error(e);
            }
        }
    }

    return endpoint;
};

const createIntegrations = async ({ apig, lambda, apiId, endpoints }) => {
    const promises = [];

    for (const endpoint of endpoints) {
        promises.push(retry(() => createIntegration({ apig, lambda, apiId, endpoint })));
    }

    return Promise.all(promises);
};

const createDeployment = async ({ apig, apiId, stage }) => {
    const deployment = await apig
        .createDeployment({ restApiId: apiId, stageName: stage })
        .promise();

    // todo add update stage functionality

    return deployment.id;
};

const removeMethod = async ({ apig, apiId, endpoint }) => {
    const params = {
        restApiId: apiId,
        resourceId: endpoint.id,
        httpMethod: endpoint.method
    };

    try {
        await apig.deleteMethod(params).promise();
    } catch (e) {
        if (e.code !== "NotFoundException") {
            throw Error(e);
        }
    }

    return {};
};

const removeMethods = async ({ apig, apiId, endpoints }) => {
    const promises = [];

    for (const endpoint of endpoints) {
        promises.push(removeMethod({ apig, apiId, endpoint }));
    }

    return Promise.all(promises);
};

const removeResource = async ({ apig, apiId, endpoint }) => {
    try {
        await apig.deleteResource({ restApiId: apiId, resourceId: endpoint.id }).promise();
    } catch (e) {
        if (e.code !== "NotFoundException") {
            throw Error(e);
        }
    }
    return {};
};

const removeResources = async ({ apig, apiId, endpoints }) => {
    const params = {
        restApiId: apiId
    };

    const resources = await apig.getResources(params).promise();

    const promises = [];

    for (const endpoint of endpoints) {
        const resource = resources.items.find(resourceItem => resourceItem.id === endpoint.id);

        const childResources = resources.items.filter(
            resourceItem => resourceItem.parentId === endpoint.id
        );

        const resourceMethods = resource ? Object.keys(resource.resourceMethods || {}) : [];

        // only remove resources if they don't have methods nor child resources
        // to make sure we don't disrupt other services using the same api
        if (resource && resourceMethods.length === 0 && childResources.length === 0) {
            promises.push(removeResource({ apig, apiId, endpoint }));
        }
    }

    if (promises.length === 0) {
        return [];
    }

    await Promise.all(promises);

    return removeResources({ apig, apiId, endpoints });
};

const removeApi = async ({ apig, apiId }) => {
    await apig.deleteRestApi({ restApiId: apiId }).promise();
};

const createAuthorizer = async ({ apig, lambda, apiId, endpoint }) => {
    if (endpoint.authorizer) {
        const authorizerName = endpoint.authorizer.split(":")[6];
        const region = endpoint.authorizer.split(":")[3];
        const accountId = endpoint.authorizer.split(":")[4];

        const authorizers = await apig.getAuthorizers({ restApiId: apiId }).promise();

        let authorizer = authorizers.items.find(
            authorizerItem => authorizerItem.name === authorizerName
        );

        if (!authorizer) {
            const createAuthorizerParams = {
                name: authorizerName,
                restApiId: apiId,
                type: "TOKEN",
                authorizerUri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${endpoint.authorizer}/invocations`,
                identitySource: "method.request.header.Auth"
            };

            authorizer = await apig.createAuthorizer(createAuthorizerParams).promise();

            const permissionsParams = {
                Action: "lambda:InvokeFunction",
                FunctionName: authorizerName,
                Principal: "apigateway.amazonaws.com",
                SourceArn: `arn:aws:execute-api:${region}:${accountId}:${apiId}/*/*`,
                StatementId: `${authorizerName}-${apiId}`
            };

            try {
                await lambda.addPermission(permissionsParams).promise();
            } catch (e) {
                if (e.code !== "ResourceConflictException") {
                    throw Error(e);
                }
            }
        }

        endpoint.authorizerId = authorizer.id;
    }
    return endpoint;
};

const createAuthorizers = async ({ apig, lambda, apiId, endpoints }) => {
    const updatedEndpoints = [];

    for (const endpoint of endpoints) {
        endpoint.authorizerId = (await createAuthorizer({
            apig,
            lambda,
            apiId,
            endpoint
        })).authorizerId;
        updatedEndpoints.push(endpoint);
    }

    return updatedEndpoints;
};

const removeAuthorizer = async ({ apig, apiId, endpoint }) => {
    // todo only remove authorizers that are not used by other services
    if (endpoint.authorizerId) {
        const updateMethodParams = {
            httpMethod: endpoint.method,
            resourceId: endpoint.id,
            restApiId: apiId,
            patchOperations: [
                {
                    op: "replace",
                    path: "/authorizationType",
                    value: "NONE"
                }
            ]
        };

        await apig.updateMethod(updateMethodParams).promise();

        const deleteAuthorizerParams = { restApiId: apiId, authorizerId: endpoint.authorizerId };

        await apig.deleteAuthorizer(deleteAuthorizerParams).promise();
    }
    return endpoint;
};

const removeAuthorizers = async ({ apig, apiId, endpoints }) => {
    const promises = [];

    for (const endpoint of endpoints) {
        promises.push(removeAuthorizer({ apig, apiId, endpoint }));
    }

    await Promise.all(promises);

    return endpoints;
};

const removeOutdatedEndpoints = async ({ apig, apiId, endpoints, stateEndpoints }) => {
    const outdatedEndpoints = [];
    const outdatedAuthorizers = [];
    for (const stateEndpoint of stateEndpoints) {
        const endpointInUse = endpoints.find(
            endpoint =>
                endpoint.method === stateEndpoint.method && endpoint.path === stateEndpoint.path
        );

        const authorizerInUse = endpoints.find(
            endpoint => endpoint.authorizerId === stateEndpoint.authorizerId
        );

        if (!endpointInUse) {
            outdatedEndpoints.push(stateEndpoint);
        } else if (!authorizerInUse) {
            outdatedAuthorizers.push(stateEndpoint);
        }
    }

    await removeResources({ apig, apiId, endpoints: outdatedEndpoints });
    await removeMethods({ apig, apiId, endpoints: outdatedEndpoints });
    await removeAuthorizers({ apig, apiId, endpoints: outdatedAuthorizers });

    return outdatedEndpoints;
};

module.exports = {
    validateEndpointObject,
    validateEndpoint,
    validateEndpoints,
    endpointExists,
    myEndpoint,
    apiExists,
    createApi,
    getPathId,
    createAuthorizer,
    createAuthorizers,
    createPath,
    createPaths,
    createMethod,
    createMethods,
    createIntegration,
    createIntegrations,
    createDeployment,
    removeMethod,
    removeMethods,
    removeResource,
    removeResources,
    removeAuthorizer,
    removeAuthorizers,
    removeApi,
    removeOutdatedEndpoints,
    retry
};

const path = require("path");
const fs = require("fs");
const { getPulumi, login } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");

// In general , storage may have different resource names than API.
// We are replacing it, so it will be recognized by pulumi code.
// Also, users may have their resource name customized, so after migrating to new pulumi application may break.
// This allows to customize a way in which resources are migrated from API to storage.
// `oldName` - name that is currently used in pulumi code
// `newName` - name used inside new pulumi code for storage
// If user has customized names, you should modify `oldName`
const storageResources = [
    {
        type: "aws:dynamodb/table:Table",
        oldName: "webiny",
        newName: "webiny"
    },
    {
        type: "aws:cognito/userPool:UserPool",
        oldName: "api-user-pool",
        newName: "user-pool"
    },
    {
        type: "aws:cognito/userPoolClient:UserPoolClient",
        oldName: "api-user-pool-client",
        newName: "user-pool-client"
    },
    {
        type: "aws:s3/bucket:Bucket",
        oldName: "fm-bucket",
        newName: "fm-bucket"
    }
];

module.exports = async inputs => {
    const apiPulumi = await getAppPulumi({
        folder: "api"
    });

    // First we export API stack into variable as JSON
    const stackJson = await exportStack({
        pulumi: apiPulumi,
        env: inputs.env
    });

    // From exported JSON we retrieve state for storage app.
    const storageState = processStorageState({
        state: JSON.parse(stackJson),
        env: inputs.env
    });

    // Also we need to update API stack state.
    const apiState = processApiState({
        // We parse JSON twice to make sure we are operating on different objects.
        state: JSON.parse(stackJson),
        env: inputs.env
    });

    // Now we can import API and storage.
    await importStack({
        app: "api",
        pulumi: apiPulumi,
        env: inputs.env,
        state: apiState
    });

    const storagePulumi = await getAppPulumi({
        folder: "apps/storage"
    });

    await importStack({
        app: "storage",
        pulumi: storagePulumi,
        env: inputs.env,
        state: storageState
    });
};

async function exportStack({ pulumi, env }) {
    const result = await pulumi.run({
        command: ["stack", "export", "--show-secrets", "-s", env]
    });

    return result.stdout;
}

async function importStack({ pulumi, env, state, app }) {
    // Importing stack can be made only using some file, so we save one.
    const stackFile = path.join(process.cwd(), `.${app}.stack.json`);
    const stackJson = JSON.stringify(state, null, 4);

    await fs.promises.writeFile(stackFile, stackJson, { encoding: "utf-8" });

    await pulumi.run({
        execa: {
            stdio: "inherit"
        },
        command: ["stack", "import", "-s", env, "--file", stackFile]
    });

    // Cleanup the temp file
    await fs.promises.rm(stackFile);
}

async function getAppPulumi({ folder }) {
    const projectApplication = getProjectApplication({
        cwd: path.join(process.cwd(), folder)
    });
    await login(projectApplication);

    return await getPulumi({
        folder: folder
    });
}

// async function getApp({ folder, env }) {
//     const projectApplication = getProjectApplication({
//         cwd: path.join(process.cwd(), folder)
//     });
//     await login(projectApplication);

//     const pulumi = await getPulumi({
//         folder: folder
//     });

//     const stack = await projectApplication.config.createOrSelectStack({
//         appDir: projectApplication.root,
//         projectDir: projectApplication.project.root,
//         env,
//         pulumi: pulumi
//     });

//     return {
//         pulumi,
//         stack
//     };
// }

function processStorageState({ state, env }) {
    // From API state we need to extract only some resources.
    const resources = state.deployment.resources.filter(resource => {
        return (
            // Stack resource is always required
            resource.type === "pulumi:pulumi:Stack" ||
            // Same goes to pulumi provider
            resource.type === "pulumi:providers:aws" ||
            isStorageResource(resource)
        );
    });

    const stack = resources.find(r => r.type === "pulumi:pulumi:Stack");

    // Clear the stack outputs, storage will have slightly different outputs.
    // This will be fixed once storage is deployed.
    stack.outputs = {};

    // We will operate on a JSON string, because some URNs are nested deep inside state JSON.
    // So it's easier to make a simple replace operation, than recursively traverse the whole tree.
    let resourcesJson = JSON.stringify(resources);

    // Stack name is generated from pulumi config, must be in a proper format.
    const storageStackUrn = `urn:pulumi:${env}::storage::pulumi:pulumi:Stack::storage-${env}`;
    // There are multiple references to the stack URN (every resource has it as its parent).
    resourcesJson = replaceAll(resourcesJson, stack.urn, storageStackUrn);

    // The same goes for provider resource
    const provider = resources.find(r => r.type === "pulumi:providers:aws");
    const apiProviderName = parseResourceUrn(provider.urn).name;
    const storageProviderUrn = `urn:pulumi:${env}::storage::pulumi:providers:aws::${apiProviderName}`;
    resourcesJson = replaceAll(resourcesJson, provider.urn, storageProviderUrn);

    // Storage has a little bit different resource names than API.
    // We are replacing it, so it will be recognized by pulumi code.
    for (const resource of storageResources) {
        const apiResourceUrn = getResourceUrn({
            app: "api",
            env: env,
            name: resource.oldName,
            type: resource.type
        });

        const storageResourceUrn = getResourceUrn({
            app: "storage",
            env: env,
            name: resource.newName,
            type: resource.type
        });

        resourcesJson = replaceAll(resourcesJson, apiResourceUrn, storageResourceUrn);
    }

    state.deployment.resources = JSON.parse(resourcesJson);

    return state;
}

function processApiState({ state, env }) {
    let resources = state.deployment.resources.filter(resource => {
        if (resource.type === "aws:s3/bucketObject:BucketObject") {
            return false;
        }

        return (
            // We leave stack and provider untouched.
            resource.type === "pulumi:pulumi:Stack" ||
            resource.type === "pulumi:providers:aws" ||
            // All resources that are belonging to storage will be removed from API
            !isStorageResource(resource)
        );
    });

    for (const resource of storageResources) {
        const resourceUrn = getResourceUrn({
            app: "api",
            env: env,
            name: resource.oldName,
            type: resource.type
        });

        // Remove any resource that is direct child of any storage resource
        // This may be for example S3 object that sits inside fm-bucket
        resources = resources.filter(r => r.parent !== resourceUrn);

        // Do the same with dependencies (recursively)
        for (const resource of resources) {
            removeResourceDependencies(resource, resourceUrn);
        }
    }

    state.deployment.resources = resources;

    return state;
}

function parseResourceUrn(urn) {
    const regex = /urn:pulumi:(.*?)::(.*?)::(.*?)::(.*)/;
    const match = regex.exec(urn);
    if (!match) {
        return null;
    }

    return {
        env: match[1],
        app: match[2],
        type: match[3],
        name: match[4]
    };
}

function getResourceUrn({ app, name, type, env }) {
    return `urn:pulumi:${env}::${app}::${type}::${name}`;
}

function isStorageResource(resource) {
    const urn = parseResourceUrn(resource.urn);

    return storageResources.some(r => {
        return r.type === resource.type && urn.name === r.oldName;
    });
}

function replaceAll(str, search, replacer) {
    // Just a hacky way to do replaceAll.
    return str.split(search).join(replacer);
}

function removeResourceDependencies(obj, urn) {
    if (!obj) {
        return;
    }

    if (Array.isArray(obj)) {
        const index = obj.indexOf(urn);
        if (index >= 0) {
            obj.splice(index, 1);
        } else {
            for (const item of obj) {
                removeResourceDependencies(item, urn);
            }
        }
    }

    if (typeof obj === "object") {
        for (const key of Object.keys(obj)) {
            removeResourceDependencies(obj[key], urn);
        }
    }
}

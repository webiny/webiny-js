const Listr = require("listr");
const inquirer = require("inquirer");
const { blue, green, red } = require("chalk");
const {
    getAllCloudFrontDistributions,
    getAllApiGateways,
    getAllFunctions,
    getAllIAMRoles,
    getAllLogGroups,
    generateTasks
} = require("./utils");

inquirer.registerPrompt("search", require("inquirer-checkbox-plus-prompt"));

const generateOptions = resources => {
    return resources
        .map(({ type, data, padding }) => {
            switch (type) {
                case "lambda":
                    return {
                        name: `[Lambda] ${green(
                            data.FunctionName.padEnd(padding, " ")
                        )}\t(last modified: ${blue(new Date(data.LastModified).toISOString())})`,
                        value: { type, data },
                        short: data.FunctionArn
                    };
                case "api-gateway":
                    return {
                        name: `[API Gateway] ${green(
                            data.name.padEnd(padding, " ")
                        )}\t(created on: ${blue(new Date(data.createdDate).toISOString())})`,
                        value: { type, data },
                        short: data.id
                    };
                case "cloudfront":
                    return {
                        name: `[CloudFront] ${green(data.DomainName)} (${
                            data.Enabled ? green("enabled") : red("disabled")
                        })\t(last modified: ${blue(
                            new Date(data.LastModifiedTime).toISOString()
                        )})`,
                        value: { type, data },
                        short: data.ARN
                    };
                case "iam-role":
                    return {
                        name: `[IAM Role] ${green(
                            data.RoleName.padEnd(padding, " ")
                        )}\t(created on: ${blue(new Date(data.CreateDate).toISOString())})`,
                        value: { type, data },
                        short: data.Arn
                    };
                case "log-group":
                    return {
                        name: `[LogGroup] ${green(
                            data.logGroupName.padEnd(padding, " ")
                        )}\t(created on: ${blue(new Date(data.creationTime).toISOString())})`,
                        value: { type, data },
                        short: data.arn
                    };
                default:
                    return null;
            }
        })
        .filter(Boolean);
};

const getPadding = (items, prop) => {
    return items.map(item => item[prop].length).sort((a, b) => b - a)[0];
};

(async () => {
    // Fetch resources
    const fetcher = new Listr(
        [
            {
                title: "Fetching Lambda functions...",
                task: async (context, task) => {
                    const items = await getAllFunctions();
                    const padding = getPadding(items, "FunctionName");
                    task.title = `Fetched ${blue(items.length)} Lambda functions!`;
                    items.forEach(item =>
                        context.resources.push({ type: "lambda", data: item, padding })
                    );
                }
            },
            {
                title: "Fetching API Gateways...",
                task: async (context, task) => {
                    const items = await getAllApiGateways();
                    const padding = getPadding(items, "name");
                    task.title = `Fetched ${blue(items.length)} API Gateways!`;
                    items.forEach(item =>
                        context.resources.push({ type: "api-gateway", data: item, padding })
                    );
                }
            },
            {
                title: "Fetching CloudFront distributions...",
                task: async (context, task) => {
                    const items = await getAllCloudFrontDistributions();
                    const padding = getPadding(items, "DomainName");
                    task.title = `Fetched ${blue(items.length)} CloudFront distributions!`;
                    items.forEach(item =>
                        context.resources.push({ type: "cloudfront", data: item, padding })
                    );
                }
            },
            {
                title: "Fetching IAM roles...",
                task: async (context, task) => {
                    const items = await getAllIAMRoles();
                    const padding = getPadding(items, "RoleName");
                    task.title = `Fetched ${blue(items.length)} IAM roles!`;
                    items.forEach(item =>
                        context.resources.push({ type: "iam-role", data: item, padding })
                    );
                }
            },
            {
                title: "Fetching CloudWatch Log Groups...",
                task: async (context, task) => {
                    const items = await getAllLogGroups();
                    const padding = getPadding(items, "logGroupName");
                    task.title = `Fetched ${blue(items.length)} Log Groups!`;
                    items.forEach(item =>
                        context.resources.push({ type: "log-group", data: item, padding })
                    );
                }
            }
        ],
        { concurrent: true }
    );

    const context = { resources: [] };
    const { resources } = await fetcher.run(context);

    // Prompt user to select resources to delete
    const options = generateOptions(resources);

    const res = await inquirer.prompt([
        {
            name: "resources",
            type: "search",
            message: "Select resources to delete",
            searchable: true,
            pageSize: 30,
            source: async (answersSoFar, input) => {
                if (!input) {
                    return options;
                }
                return options.filter(opt => opt.name.includes(input));
            }
        }
    ]);

    const groupedResources = res.resources.reduce((acc, item) => {
        if (!acc[item.type]) {
            acc[item.type] = [];
        }

        acc[item.type].push(item.data);
        return acc;
    }, {});

    const tasks = new Listr([...generateTasks(groupedResources)], { concurrent: true });

    const newContext = {};
    tasks.run(newContext).catch(err => {
        console.error(err);
    });
})();

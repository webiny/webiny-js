import inquirer from "inquirer";
import { discoverAgents } from "@webiny/mcp";
import { StorageOps } from "./types.js";
import { availableAwsRegions } from "./availableAwsRegions.js";

const STORAGE_OPTIONS: Record<StorageOps, { value: StorageOps; name: string }> = {
    ddb: {
        value: "ddb",
        name: "DynamoDB (for small and medium sized projects)"
    },
    "ddb-os": {
        value: "ddb-os",
        name: "Amazon DynamoDB + Amazon OpenSearch (for larger projects)"
    }
};

export const runInteractivePrompt = async () => {
    console.log(
        "In order to create your new Webiny project, please answer the following questions."
    );
    console.log();

    const agents = await discoverAgents();
    const agentChoices = [
        ...Array.from(agents.values()).map(a => ({
            value: a.preset.slug,
            name: a.preset.displayName
        })),
        { value: "other", name: "Other / not listed" }
    ];

    return inquirer.prompt([
        {
            type: "select",
            name: "region",
            default: "us-east-1",
            message: "Please choose the AWS region in which your project will be deployed:",
            // Some of the regions might be commented out (not all service supported).
            choices: availableAwsRegions
        },
        {
            type: "select",
            name: "storageOps",
            default: "ddb",
            message: `Please choose the database setup you wish to use with your project:`,
            choices: Object.values(STORAGE_OPTIONS)
        },
        {
            type: "select",
            name: "aiAgent",
            default: "claude",
            message: "Please choose the AI agent you will use with your project:",
            choices: agentChoices
        }
    ]);
};

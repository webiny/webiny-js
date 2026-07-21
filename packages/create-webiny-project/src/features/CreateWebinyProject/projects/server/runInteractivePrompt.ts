import inquirer from "inquirer";
import { discoverAgents } from "@webiny/mcp";
import { StorageOps } from "./types.js";

const STORAGE_OPTIONS: Record<StorageOps, { value: StorageOps; name: string }> = {
    sqlite: {
        value: "sqlite",
        name: "SQLite (single-file local database)"
    }
};

export const runInteractivePrompt = async () => {
    console.log(
        "In order to create your new self-hosted Webiny project, please answer the following questions."
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
            name: "storageOps",
            default: "sqlite",
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

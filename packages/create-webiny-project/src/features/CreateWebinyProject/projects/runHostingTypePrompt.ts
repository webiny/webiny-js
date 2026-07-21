import inquirer from "inquirer";

export type HostingType = "aws" | "server";

const HOSTING_TYPE_OPTIONS: { value: HostingType; name: string }[] = [
    {
        value: "aws",
        name: "AWS (Lambda, DynamoDB, API Gateway — deployed with Pulumi)"
    },
    {
        value: "server",
        name: "Self-hosted / server (Node HTTP server + SQL storage) — ALPHA"
    }
];

export const runHostingTypePrompt = async (): Promise<HostingType> => {
    console.log("How would you like to host your new Webiny project?");
    console.log();

    const { hostingType } = await inquirer.prompt<{ hostingType: HostingType }>([
        {
            type: "select",
            name: "hostingType",
            default: "aws",
            message: "Please choose how you would like to host your project:",
            choices: HOSTING_TYPE_OPTIONS
        }
    ]);

    return hostingType;
};

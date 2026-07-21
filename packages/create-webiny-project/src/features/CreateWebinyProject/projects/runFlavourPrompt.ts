import inquirer from "inquirer";

export type Flavour = "aws" | "server";

const FLAVOUR_OPTIONS: { value: Flavour; name: string }[] = [
    {
        value: "aws",
        name: "AWS (Lambda, DynamoDB, API Gateway — deployed with Pulumi)"
    },
    {
        value: "server",
        name: "Self-hosted / server (Node HTTP server + SQL storage) — ALPHA"
    }
];

export const runFlavourPrompt = async (): Promise<Flavour> => {
    console.log("How would you like to host your new Webiny project?");
    console.log();

    const { flavour } = await inquirer.prompt<{ flavour: Flavour }>([
        {
            type: "select",
            name: "flavour",
            default: "aws",
            message: "Please choose how you would like to host your project:",
            choices: FLAVOUR_OPTIONS
        }
    ]);

    return flavour;
};

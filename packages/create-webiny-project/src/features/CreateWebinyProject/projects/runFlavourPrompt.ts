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
    console.log("Which deployment flavour would you like to use for your new Webiny project?");
    console.log();

    const { flavour } = await inquirer.prompt<{ flavour: Flavour }>([
        {
            type: "select",
            name: "flavour",
            default: "aws",
            message: "Please choose the deployment flavour:",
            choices: FLAVOUR_OPTIONS
        }
    ]);

    return flavour;
};

const ui = require("cliui")();
const { green } = require("chalk");

ui.div({
    text: "Options:",
    padding: [1, 0, 0, 0]
});

ui.div(
    {
        text: "--env",
        width: 20,
        padding: [0, 4, 0, 2]
    },
    {
        text: "Environment to deploy.",
        width: 25
    },
    {
        text: "[required]",
        align: "left"
    }
);

ui.div(
    {
        text: "--apps",
        width: 20,
        padding: [0, 4, 0, 2]
    },
    {
        text: "Deploy apps.",
        width: 25
    },
    {
        text: "[optional]",
        align: "left"
    }
);

ui.div(
    {
        text: "--api",
        width: 20,
        padding: [0, 4, 0, 2]
    },
    {
        text: "Deploy API.",
        width: 25
    },
    {
        text: "[optional]",
        align: "left"
    }
);

ui.div(
    {
        text: "--debug",
        width: 20,
        padding: [0, 4, 0, 2]
    },
    {
        text: "Show debug logs.",
        width: 25
    },
    {
        text: "[optional]",
        align: "left"
    }
);

ui.div({
    text: `NOTE: ${green("--api")} and ${green("--apps")} flags are mutually exclusive.`,
    width: 60,
    padding: [1, 0, 1, 0]
});

ui.div({
    text: `EXAMPLE USAGE: to deploy your API to a ${green("prod")} environment defined in ${green(".env.api.js")}:`,
    width: 100,
    padding: [1, 0, 1, 0]
});

ui.div({
    text: green("sls --env=prod --api --debug"),
    width: 100,
    padding: [0, 0, 1, 2]
});

console.log(ui.toString());

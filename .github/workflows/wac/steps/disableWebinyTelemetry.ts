export const disableWebinyTelemetry = {
    name: "Disable Webiny telemetry",
    run: 'mkdir ~/.webiny && echo \'{ "id": "ci", "telemetry": false }\' > ~/.webiny/config\n'
};

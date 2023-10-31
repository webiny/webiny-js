export const createSetupVerdaccioSteps = ({ workingDirectory = "dev" } = {}) => {
    return [
        {
            name: "Start Verdaccio local server",
            "working-directory": workingDirectory,
            run: "npx pm2 start verdaccio -- -c .verdaccio.yaml"
        },
        {
            name: "Configure NPM to use local registry",
            run: "npm config set registry http://localhost:4873"
        },
        {
            name: "Set git email",
            run: 'git config --global user.email "webiny-bot@webiny.com"'
        },
        {
            name: "Set git username",
            run: 'git config --global user.name "webiny-bot"'
        }
    ];
};

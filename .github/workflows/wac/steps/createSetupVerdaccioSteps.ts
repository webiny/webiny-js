export const createSetupVerdaccioSteps = ({ workingDirectory = "" } = {}) => {
    return [
        {
            name: "Start Verdaccio local server",
            "working-directory": workingDirectory,
            /*
             * Only pm2 is added. Verdaccio is a devDependency of this repository, so its version
             * comes from `yarn.lock`. `yarn add pm2 verdaccio` used to replace it with the latest
             * release, which pulled in Verdaccio 7 (2026-10-25) as soon as `npmMinimalAgeGate`
             * (3 days) let it through. Verdaccio 7 rejects the dummy auth token CI writes into
             * `.npmrc`, so every publish failed with E401 from 2026-10-28 on.
             */
            run: "yarn add pm2 && npx pm2 start verdaccio -- -c .verdaccio.yaml"
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

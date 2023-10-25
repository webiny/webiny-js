export const createSetupVerdaccioSteps = ({
    workingDirectory = "dev",
    verdaccioFilesArtifactName = "verdaccio-files"
} = {}) => {
    return [
        {
            name: "Start Verdaccio local server",
            "working-directory": workingDirectory,
            run: "npx pm2 start verdaccio -- -c .verdaccio.yaml"
        },
        {
            name: 'Create ".npmrc" file in the project root, with a dummy auth token',
            "working-directory": workingDirectory,
            run: "echo '//localhost:4873/:_authToken=\"dummy-auth-token\"' > .npmrc"
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
        },
        {
            name: "Version and publish to Verdaccio",
            "working-directory": workingDirectory,
            run: "yarn release --type=verdaccio"
        },
        {
            name: "Create verdaccio-files artifact",
            uses: "actions/upload-artifact@v3",
            with: {
                name: verdaccioFilesArtifactName,
                "retention-days": 1,
                path: "dev/.verdaccio/\ndev/.verdaccio.yaml\n"
            }
        }
    ];
};

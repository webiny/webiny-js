export const createDeployWebinySteps = ({ workingDirectory = "dev" } = {}) => {
    return [
        {
            name: "Deploy Core",
            "working-directory": workingDirectory,
            run: "yarn webiny deploy apps/core --env dev"
        },
        {
            name: "Deploy API",
            "working-directory": workingDirectory,
            run: "yarn webiny deploy apps/api --env dev"
        },
        {
            name: "Deploy Admin Area",
            "working-directory": workingDirectory,
            run: "yarn webiny deploy apps/admin --env dev"
        },
        {
            name: "Deploy Website",
            "working-directory": workingDirectory,
            run: "yarn webiny deploy apps/website --env dev"
        }
    ];
};

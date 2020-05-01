module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            "@webiny/cli-scaffold-graphql-service",
            "@webiny/cli-scaffold-custom-lambda",
            {
                name: "cool-plugin-dinner",
                type: "scaffold-template",
                scaffold: {
                    name: "Dinner making scaffold plugin",
                    questions: () => [],
                    generate: async () => {
                        console.log("Dinner has been prepared!\n");
                    }
                }
            }
        ]
    }
};

export const devVersionErrorResponse = () => {
    return {
        error: {
            message: [
                `This project is using a development version 0.0.0!`,
                `Migrations cannot be executed using version 0.0.0, as that makes them all eligible for execution.`,
                `To trigger a particular set of migrations, set a WEBINY_VERSION variable in the .env file.`
            ].join(" ")
        }
    };
};

const { Pulumi } = require("../src");

describe(`Command "run" test`, () => {
    it("should create a new project successfully", async () => {
        const pulumi = new Pulumi();
        const results = await pulumi.run(
            ["new", "aws-typescript"],
            {
                dir: "./stack",
                secretsProvider: "passphrase",
                name: "wby-infra",
                stack: "staging",
                yes: true,
                nonInteractive: true
            },
            { env: { PULUMI_CONFIG_PASSPHRASE: "123123" } }
        );

        const aa = 123;
    });
});

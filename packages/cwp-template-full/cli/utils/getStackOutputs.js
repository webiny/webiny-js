const { Pulumi } = require("@webiny/pulumi-sdk");

module.exports = async (dir, env) => {
    const pulumi = new Pulumi();
    await pulumi.run({
        command: ["stack", "select", env],
        args: { cwd: dir }
    });

    return await pulumi
        .run({
            command: ["stack", "output"],
            args: {
                stack: env,
                cwd: dir,
                json: true
            }
        })
        .then(({ stdout }) => JSON.parse(stdout));
};

const { Pulumi } = require("@webiny/pulumi-sdk");

module.exports = async (dir, env) => {
    const pulumi = new Pulumi();

    try {
        await pulumi.run({
            command: ["stack", "select", env],
            args: { cwd: dir }
        });
        return true;
    } catch (e) {
        return false;
    }
};

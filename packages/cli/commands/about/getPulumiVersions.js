const execa = require("execa");

module.exports.getPulumiVersions = async () => {
    let pulumi, pulumiAws;

    try {
        {
            const { stdout } = await execa("yarn", [
                "info",
                "@pulumi/pulumi",
                "-A",
                "-R",
                "--name-only",
                "--json"
            ]);

            const match = stdout.match(/npm:(.*?)"/);
            if (match) {
                pulumi = match[1];
            }
        }

        {
            const { stdout } = await execa("yarn", [
                "info",
                "@pulumi/aws",
                "-A",
                "-R",
                "--name-only",
                "--json"
            ]);

            const match = stdout.match(/npm:(.*?)"/);
            if (match) {
                pulumiAws = match[1];
            }
        }
    } catch (err) {
        return "";
    }

    return [pulumi, pulumiAws];
};

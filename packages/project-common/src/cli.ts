import util from "util";
import path from "path";
import ncpBase from "ncp";

const ncp = util.promisify(ncpBase.ncp);

// Export hooks plugins for deploy and watch commands.
module.exports = () => [
    {
        type: "hook-before-build",
        name: "hook-before-build-init-core-api-workspaces",
        hook: async () => {
            const from = path.join(__dirname, "templates/apps");
            const to = path.join(process.cwd(), ".webiny/workspaces");
            await ncp(from, to);
        }
    }
];

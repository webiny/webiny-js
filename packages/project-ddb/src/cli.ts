import fs from "fs";
import util from "util";
import path from "path";
import ncpBase from "ncp";

const ncp = util.promisify(ncpBase.ncp);

const cp = async (from: string, to: string) => {
    if (fs.existsSync(to)) {
        fs.rmSync(to, { recursive: true, force: true });
    }

    fs.mkdirSync(to, { recursive: true });
    await ncp(from, to);
    await new Promise(resolve => setTimeout(resolve, 500));
};

// Export hooks plugins for deploy and watch commands.
module.exports = () => [
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-core",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "core") {
                const from = path.join(__dirname, "templates/apps/core");
                const to = path.join(process.cwd(), ".webiny/workspaces/core");
                await cp(from, to);
            }
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-api",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "api") {
                const from = path.join(__dirname, "templates/apps/api");
                const to = path.join(process.cwd(), ".webiny/workspaces/api");
                await cp(from, to);
            }
        }
    }
];

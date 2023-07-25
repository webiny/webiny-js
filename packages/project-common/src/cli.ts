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
export default () => [
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-types",
        hook: async () => {
            const from = path.join(__dirname, "templates/types");
            const to = path.join(process.cwd(), ".webiny/workspaces/types");
            await cp(from, to);
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-admin",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "admin") {
                const from = path.join(__dirname, "templates/apps/admin");
                const to = path.join(process.cwd(), ".webiny/workspaces/admin");
                await cp(from, to);
            }
        }
    },
    {
        type: "hook-create-app-workspace",
        name: "hook-create-app-workspace-website",
        hook: async ({ projectApplication }: Record<string, any>) => {
            if (projectApplication.name === "website") {
                const from = path.join(__dirname, "templates/apps/website");
                const to = path.join(process.cwd(), ".webiny/workspaces/website");
                await cp(from, to);
            }
        }
    }
];

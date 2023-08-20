import execa from "execa";

export async function getPluginsData() {
    const path = [process.cwd(), "plugins/renda"].join("/");
    const { stdout } = execa.sync("ts-node", [path]);

    return JSON.parse(stdout);
}

import execa from "execa";

export async function runConfig() {
    return {
        theme: [
            { name: "light", path: "./themes/light" },
            { name: "dark", path: "./themes/dark" }
        ],
        "website.publicAsset": [{ path: "./public/sitemap.xml" }]
    };

    // const path = [process.cwd(), "plugins/renda"].join("/");
    // const { stdout } = execa.sync("yarn", ["ts-node", path]);
    //
    // return JSON.parse(stdout);
}

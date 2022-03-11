import execa from "execa";

interface BuildPackageParams {
    directory: string;
}

function getBabelParams(type: "esm" | "cjs"): string[] {
    return [
        "src",
        "--extensions",
        ".ts,.tsx",
        "--out-dir",
        `lib/${type}`,
        "--source-maps",
        "--copy-files"
    ];
}

export async function buildPackage({ directory }: BuildPackageParams) {
    await Promise.all([
        // Build ESM
        execa("babel", getBabelParams("esm"), { cwd: directory, env: { BABEL_ENV: "esm" } }),
        // Build CJS
        execa("babel", getBabelParams("cjs"), { cwd: directory, env: { BABEL_ENV: "cjs" } }),
        // Generate TS declarations
        execa("ttsc", ["-p", "tsconfig.build.json"], { cwd: directory })
    ]);
}

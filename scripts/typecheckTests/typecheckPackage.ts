import { execFileSync } from "node:child_process";
import path from "node:path";

export const typecheckPackage = (packageFolder: string): string => {
    const configPath = path.join(packageFolder, "tsconfig.check-tests.json");
    const folderName = path.basename(packageFolder);
    const testsPrefix = `${folderName}/__tests__/`;

    let output = "";

    try {
        execFileSync("npx", ["tsc", "-p", configPath], {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            shell: process.platform === "win32"
        });
    } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string };
        output = error.stdout || error.stderr || "";
    }

    /* Only keep errors from this package's __tests__ files. */
    return output
        .split("\n")
        .filter(line => line.includes(testsPrefix) && line.includes("error TS"))
        .join("\n");
};

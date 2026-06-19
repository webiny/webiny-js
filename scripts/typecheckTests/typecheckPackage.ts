import { execFileSync } from "node:child_process";
import path from "node:path";

export const typecheckPackage = (packageFolder: string): string => {
    const configPath = path.join(packageFolder, "tsconfig.check-tests.json");

    try {
        execFileSync("npx", ["tsc", "-p", configPath], {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"],
            shell: process.platform === "win32"
        });

        return "";
    } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string };
        return error.stdout || error.stderr || "";
    }
};

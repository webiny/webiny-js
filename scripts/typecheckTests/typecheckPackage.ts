import { execFileSync } from "node:child_process";

export const typecheckPackage = (packageFolder: string): string => {
    const configPath = packageFolder + "/tsconfig.check-tests.json";

    try {
        execFileSync("npx", ["tsc", "-p", configPath], {
            encoding: "utf-8",
            stdio: ["pipe", "pipe", "pipe"]
        });

        return "";
    } catch (err: unknown) {
        const error = err as { stdout?: string; stderr?: string };
        return error.stdout || error.stderr || "";
    }
};

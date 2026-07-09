import { execFileSync } from "node:child_process";

export function runTsc(tscPath, args, cwd) {
    try {
        execFileSync(tscPath, args, {
            cwd,
            stdio: ["pipe", "pipe", "pipe"],
            encoding: "utf8",
            maxBuffer: 10 * 1024 * 1024
        });
    } catch (error) {
        const output = [error.stdout, error.stderr].filter(Boolean).join("\n").trim();
        throw { message: output || error.message || "TypeScript compilation failed." };
    }
}

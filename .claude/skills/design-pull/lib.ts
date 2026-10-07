/**
 * Logic for the design-pull and design-ask skills. Node built-ins only.
 * The command-line entry is design.ts; run it with `yarn tsx .claude/skills/design-pull/design.ts`.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const MCP_MAX_FILE = 8192;
export const MCP_LIMIT = 262144;
export const TEXT_EXTENSIONS = new Set([".html", ".htm", ".css", ".js", ".mjs", ".json", ".md", ".txt", ".svg"]);
export const DEFAULT_EXCLUDE = [".thumbnail", "design_handoff_*/**"];
export const DEFAULT_SUPPORT = ["_ds/**", "support.js", "assets/**"];
export const ANSWERS_PATH = "answers.md";

export class DesignError extends Error {}

// ---------------------------------------------------------------- time

export const nowIso = (): string => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export const parseIso = (value: string): Date => new Date(value);

export const today = (): string => {
    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// ---------------------------------------------------------------- paths

// eslint-disable-next-line no-control-regex
const CONTROL = /[\x00-\x1f\x7f]/;

export const validateRelPath = (rel: string): string => {
    if (!rel || rel.startsWith("/") || rel.startsWith("~") || rel.includes("\\") || CONTROL.test(rel)) {
        throw new DesignError(`unsafe path: ${JSON.stringify(rel)}`);
    }
    if (rel.split("/").some(part => part === "" || part === "." || part === "..")) {
        throw new DesignError(`unsafe path: ${JSON.stringify(rel)}`);
    }
    return rel;
};

const isSymlink = (file: string): boolean => {
    try {
        return fs.lstatSync(file).isSymbolicLink();
    } catch {
        return false;
    }
};

export const isRegularFile = (file: string): boolean => {
    try {
        return fs.lstatSync(file).isFile();
    } catch {
        return false;
    }
};

/**
 * Joins a validated relative path to a root. Rejects symlinked directories on the way,
 * so the result always stays inside the root.
 */
export const safeJoin = (root: string, rel: string): string => {
    validateRelPath(rel);
    let current = root;
    for (const part of rel.split("/").slice(0, -1)) {
        current = path.join(current, part);
        if (isSymlink(current)) {
            throw new DesignError(`symlinked directory in path: ${JSON.stringify(rel)}`);
        }
    }
    return path.join(root, rel);
};

export const collisionKey = (rel: string): string => rel.normalize("NFC").toLowerCase();

export const isText = (rel: string): boolean => TEXT_EXTENSIONS.has(path.extname(rel).toLowerCase());

export const atomicWriteBytes = (file: string, data: Buffer | string): void => {
    const dir = path.dirname(file);
    fs.mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, `.tmp-${crypto.randomBytes(6).toString("hex")}`);
    try {
        fs.writeFileSync(tmp, data, { flag: "wx" });
        fs.renameSync(tmp, file);
    } catch (error) {
        fs.rmSync(tmp, { force: true });
        throw error;
    }
};

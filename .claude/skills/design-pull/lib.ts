/**
 * Logic for the design-pull and design-ask skills. Node built-ins only.
 * The command-line entry is design.ts; run it with `yarn tsx .claude/skills/design-pull/design.ts`.
 */
import { spawnSync } from "node:child_process";
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

// ---------------------------------------------------------------- patterns

const escapeRegex = (char: string): string => char.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");

export const compilePattern = (pattern: string): RegExp => {
    let out = "";
    let i = 0;
    while (i < pattern.length) {
        if (pattern.startsWith("**/", i)) {
            out += "(?:.*/)?";
            i += 3;
        } else if (pattern.startsWith("**", i)) {
            out += ".*";
            i += 2;
        } else if (pattern[i] === "*") {
            out += "[^/]*";
            i += 1;
        } else if (pattern[i] === "?") {
            out += "[^/]";
            i += 1;
        } else {
            out += escapeRegex(pattern[i]);
            i += 1;
        }
    }
    return new RegExp(`^${out}$`, "s");
};

/** Gitignore-style matching against a whole relative path; the last matching pattern wins, `!` re-includes. */
export const matches = (rel: string, patterns: string[]): boolean => {
    let result = false;
    for (const pattern of patterns) {
        const negate = pattern.startsWith("!");
        const body = negate ? pattern.slice(1) : pattern;
        if (compilePattern(body).test(rel)) {
            result = !negate;
        }
    }
    return result;
};

// ---------------------------------------------------------------- catalogue

export type Kind = "screen" | "support";

export interface Row {
    file: string;
    kind: Kind;
    etagPulled: string;
    pulledAt: string;
    etagImplemented: string;
    implementedAt: string;
    commit: string;
    removedAt: string;
}

export interface Catalogue {
    project: string;
    projectId: string;
    source: string;
    exclude: string[];
    support: string[];
    lastPull: string;
    answersEtag: string;
    rows: Record<string, Row>;
}

const COLUMNS = [
    "file",
    "kind",
    "etag_pulled",
    "pulled_at",
    "etag_implemented",
    "implemented_at",
    "commit",
    "removed_at",
    "status"
];

export const createRow = (file: string, values: Partial<Omit<Row, "file">> = {}): Row => ({
    file,
    kind: "screen",
    etagPulled: "",
    pulledAt: "",
    etagImplemented: "",
    implementedAt: "",
    commit: "",
    removedAt: "",
    ...values
});

export const createCatalogue = (project: string, projectId: string): Catalogue => ({
    project,
    projectId,
    source: "/",
    exclude: [...DEFAULT_EXCLUDE],
    support: [...DEFAULT_SUPPORT],
    lastPull: "",
    answersEtag: "",
    rows: {}
});

export const rowStatus = (cat: Catalogue, row: Row): string => {
    if (row.removedAt) {
        return "removed";
    }
    if (matches(row.file, cat.exclude)) {
        return "excluded";
    }
    if (row.kind === "support") {
        return "support";
    }
    if (!row.etagImplemented) {
        return "new";
    }
    return row.etagImplemented === row.etagPulled ? "implemented" : "pending";
};

export const kindFor = (cat: Catalogue, rel: string): Kind => (matches(rel, cat.support) ? "support" : "screen");

const trimSlashes = (value: string): string => value.replace(/^\/+|\/+$/g, "");

export const toSourceRel = (cat: Catalogue, projectPath: string): string | null => {
    const source = trimSlashes(cat.source);
    if (!source) {
        return projectPath;
    }
    const prefix = `${source}/`;
    return projectPath.startsWith(prefix) ? projectPath.slice(prefix.length) : null;
};

export const toProjectPath = (cat: Catalogue, rel: string): string => {
    const source = trimSlashes(cat.source);
    return source ? `${source}/${rel}` : rel;
};

const escapeCell = (value: string): string => value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|");

const splitRow = (line: string): string[] => {
    const inner = line.slice(1, -1);
    const cells: string[] = [];
    let current = "";
    for (let i = 0; i < inner.length; i++) {
        const char = inner[i];
        if (char === "\\" && i + 1 < inner.length) {
            current += inner[i + 1];
            i++;
        } else if (char === "|") {
            cells.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    cells.push(current);
    return cells.map(cell => (cell.length >= 2 ? cell.slice(1, -1) : cell.trim()));
};

const LIST_KEYS = new Set(["exclude", "support"]);

export const parseCatalogue = (text: string): Catalogue => {
    const lines = text.split("\n");
    const end = lines.indexOf("---", 1);
    if (lines[0] !== "---" || end < 0) {
        throw new DesignError("catalogue.md: missing header block");
    }
    const data: Record<string, string | string[]> = {};
    let key = "";
    for (const line of lines.slice(1, end)) {
        if (line.startsWith("  - ") && LIST_KEYS.has(key)) {
            (data[key] as string[]).push(line.slice(4));
            continue;
        }
        const colon = line.indexOf(":");
        key = (colon < 0 ? line : line.slice(0, colon)).trim();
        const value = colon < 0 ? "" : line.slice(colon + 1).trim();
        data[key] = LIST_KEYS.has(key) ? [] : value;
    }
    const valueOf = (name: string): string => (typeof data[name] === "string" ? (data[name] as string) : "");
    const list = (name: string): string[] => (Array.isArray(data[name]) ? (data[name] as string[]) : []);
    const cat: Catalogue = {
        project: valueOf("project"),
        projectId: valueOf("project_id"),
        source: valueOf("source") || "/",
        exclude: list("exclude"),
        support: list("support"),
        lastPull: valueOf("last_pull"),
        answersEtag: valueOf("answers_etag"),
        rows: {}
    };
    for (const line of lines.slice(end + 1)) {
        if (!line.startsWith("| ") || line.startsWith("| file |")) {
            continue;
        }
        const [file, kind, etagPulled, pulledAt, etagImplemented, implementedAt, commit, removedAt] = splitRow(line);
        cat.rows[file] = {
            file,
            kind: kind === "support" ? "support" : "screen",
            etagPulled,
            pulledAt,
            etagImplemented,
            implementedAt,
            commit,
            removedAt
        };
    }
    return cat;
};

export const renderCatalogue = (cat: Catalogue): string => {
    const out = [
        "---",
        `project: ${cat.project}`,
        `project_id: ${cat.projectId}`,
        `source: ${cat.source}`,
        "exclude:",
        ...cat.exclude.map(pattern => `  - ${pattern}`),
        "support:",
        ...cat.support.map(pattern => `  - ${pattern}`),
        `last_pull: ${cat.lastPull}`,
        `answers_etag: ${cat.answersEtag}`,
        "---",
        "",
        `| ${COLUMNS.join(" | ")} |`,
        `|${COLUMNS.map(() => "---").join("|")}|`
    ];
    for (const name of Object.keys(cat.rows).sort()) {
        const row = cat.rows[name];
        const values = [
            row.file,
            row.kind,
            row.etagPulled,
            row.pulledAt,
            row.etagImplemented,
            row.implementedAt,
            row.commit,
            row.removedAt,
            rowStatus(cat, row)
        ];
        out.push(`| ${values.map(escapeCell).join(" | ")} |`);
    }
    return `${out.join("\n")}\n`;
};

export const loadCatalogue = (folder: string): Catalogue => {
    const file = path.join(folder, "catalogue.md");
    if (!isRegularFile(file)) {
        throw new DesignError(`no catalogue.md in ${folder}`);
    }
    return parseCatalogue(fs.readFileSync(file, "utf8"));
};

export const saveCatalogue = (folder: string, cat: Catalogue): void => {
    atomicWriteBytes(path.join(folder, "catalogue.md"), renderCatalogue(cat));
};

// ---------------------------------------------------------------- repository

const git = (cwd: string, ...args: string[]): string => {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    if (result.status !== 0) {
        throw new DesignError(`git ${args.join(" ")} failed: ${(result.stderr || "").trim()}`);
    }
    return result.stdout.trim();
};

export const repoTop = (cwd: string = process.cwd()): string =>
    fs.realpathSync(git(cwd, "rev-parse", "--show-toplevel"));

export const excludePath = (top: string): string => {
    const file = git(top, "rev-parse", "--git-path", "info/exclude");
    return path.isAbsolute(file) ? file : path.join(top, file);
};

const GITIGNORE_SPECIAL = new Set(["\\", "*", "?", "[", "!", "#"]);

export const escapeGitignore = (value: string): string =>
    [...value].map(char => (GITIGNORE_SPECIAL.has(char) ? `\\${char}` : char)).join("");

export const unescapeGitignore = (value: string): string => value.replace(/\\(.)/gs, "$1");

export const printJson = (value: unknown): void => {
    process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
};

/** Resolves symlinks in the longest existing prefix of a path, keeping the rest as is. */
const realpathLoose = (target: string): string => {
    let existing = path.resolve(target);
    const rest: string[] = [];
    while (!fs.existsSync(existing)) {
        rest.unshift(path.basename(existing));
        existing = path.dirname(existing);
    }
    return path.join(fs.realpathSync(existing), ...rest);
};

// ---------------------------------------------------------------- listing

export interface ListingEntry {
    size: number;
    etag: string;
}

export type Listing = Record<string, ListingEntry>;

interface RawListingEntry {
    path: string;
    type?: string;
    size: number | string;
    etag: string | number;
}

export const loadListing = (file: string): Listing => {
    const text = fs.readFileSync(file, "utf8");
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < start) {
        throw new DesignError(`${file}: no JSON array found`);
    }
    let entries: RawListingEntry[];
    try {
        entries = JSON.parse(text.slice(start, end + 1));
    } catch (error) {
        throw new DesignError(`${file}: invalid JSON: ${(error as Error).message}`);
    }
    const listing: Listing = {};
    for (const entry of entries) {
        if ((entry.type ?? "file") === "file") {
            listing[entry.path] = { size: Number(entry.size), etag: String(entry.etag) };
        }
    }
    return listing;
};

// ---------------------------------------------------------------- commands: folders

export const cmdInit = (folderArg: string, project: string, projectId: string): void => {
    const top = repoTop();
    const folder = realpathLoose(path.resolve(top, folderArg));
    const rel = path.relative(top, folder);
    if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
        throw new DesignError(`folder must be inside the repository: ${folderArg}`);
    }
    if (fs.existsSync(path.join(folder, "catalogue.md"))) {
        throw new DesignError(`catalogue.md already exists in ${folder}`);
    }
    fs.mkdirSync(folder, { recursive: true });
    saveCatalogue(folder, createCatalogue(project, projectId));
    const posixRel = rel.split(path.sep).join("/");
    const entry = `/${escapeGitignore(posixRel)}/`;
    const exclude = excludePath(top);
    const existing = fs.existsSync(exclude) ? fs.readFileSync(exclude, "utf8") : "";
    if (!existing.split("\n").includes(entry)) {
        const prefix = existing === "" || existing.endsWith("\n") ? "" : "\n";
        atomicWriteBytes(exclude, `${existing}${prefix}${entry}\n`);
    }
    printJson({ folder: posixRel, exclude_entry: entry });
};

export const cmdListFolders = (): void => {
    const top = repoTop();
    const exclude = excludePath(top);
    const lines = fs.existsSync(exclude) ? fs.readFileSync(exclude, "utf8").split("\n") : [];
    const found: Array<{ folder: string; project: string }> = [];
    for (const line of lines) {
        if (!(line.startsWith("/") && line.endsWith("/") && line.length > 2)) {
            continue;
        }
        const rel = unescapeGitignore(line.slice(1, -1));
        const file = path.join(top, rel, "catalogue.md");
        if (!isRegularFile(file)) {
            continue;
        }
        try {
            const cat = parseCatalogue(fs.readFileSync(file, "utf8"));
            if (cat.projectId) {
                found.push({ folder: rel, project: cat.project });
            }
        } catch (error) {
            if (!(error instanceof DesignError)) {
                throw error;
            }
        }
    }
    printJson(found);
};

// ---------------------------------------------------------------- commands: pull

export interface AnswersResult {
    answered: number[];
    changed: number[];
    unknown: number[];
}

export interface PullPlan {
    listed_at: string;
    entries: Listing;
    adopted: string[];
    mcp: string[];
    manual: string[];
    unchanged: string[];
    removed: string[];
    excluded: string[];
    rejected: string[];
    answers: ListingEntry | null;
    imported: string[];
    failed: string[];
    reconciled: string[];
    answers_result: AnswersResult | null;
}

export const loadPlan = (file: string): PullPlan => JSON.parse(fs.readFileSync(file, "utf8"));

export const savePlan = (file: string, plan: PullPlan): void => {
    atomicWriteBytes(file, JSON.stringify(plan, null, 2));
};

/** The mirrored copy of a file, when it is a regular file (never a symlink) inside files/. */
export const localFile = (folder: string, rel: string): string | null => {
    let file: string;
    try {
        file = safeJoin(path.join(folder, "files"), rel);
    } catch (error) {
        if (error instanceof DesignError) {
            return null;
        }
        throw error;
    }
    return isRegularFile(file) ? file : null;
};

const summary = (plan: PullPlan): Omit<PullPlan, "entries"> => {
    const { entries: _entries, ...rest } = plan;
    return rest;
};

export const cmdPlan = (folder: string, listingFile: string, out: string): void => {
    const cat = loadCatalogue(folder);
    const listing = loadListing(listingFile);
    const plan: PullPlan = {
        listed_at: nowIso(),
        entries: {},
        adopted: [],
        mcp: [],
        manual: [],
        unchanged: [],
        removed: [],
        excluded: [],
        rejected: [],
        answers: listing[ANSWERS_PATH] ?? null,
        imported: [],
        failed: [],
        reconciled: [],
        answers_result: null
    };

    const candidates: Listing = {};
    for (const [projectPath, entry] of Object.entries(listing)) {
        if (projectPath === ANSWERS_PATH) {
            continue;
        }
        const rel = toSourceRel(cat, projectPath);
        if (rel === null) {
            continue;
        }
        try {
            validateRelPath(rel);
        } catch {
            plan.rejected.push(projectPath);
            continue;
        }
        if (matches(rel, cat.exclude)) {
            const row = cat.rows[rel];
            if (row && !row.removedAt) {
                plan.excluded.push(rel);
            }
            continue;
        }
        candidates[rel] = entry;
    }

    const groups = new Map<string, string[]>();
    for (const rel of Object.keys(candidates)) {
        const key = collisionKey(rel);
        groups.set(key, [...(groups.get(key) ?? []), rel]);
    }
    for (const group of groups.values()) {
        if (group.length > 1) {
            for (const rel of group) {
                plan.rejected.push(rel);
                delete candidates[rel];
            }
        }
    }

    for (const rel of Object.keys(candidates).sort()) {
        const entry = candidates[rel];
        plan.entries[rel] = entry;
        const kind = kindFor(cat, rel);
        let row: Row | undefined = cat.rows[rel];
        if (row) {
            row.kind = kind;
        }
        const local = localFile(folder, rel);
        const isNew = !row || Boolean(row.removedAt);
        if (row && !isNew && row.etagPulled === entry.etag && local) {
            plan.unchanged.push(rel);
            continue;
        }
        if (local && fs.statSync(local).size === entry.size) {
            const placedAfterPull =
                !row || !row.pulledAt || fs.statSync(local).mtimeMs > parseIso(row.pulledAt).getTime();
            if (placedAfterPull) {
                row = row ?? createRow(rel);
                row.kind = kind;
                row.etagPulled = entry.etag;
                row.pulledAt = nowIso();
                row.removedAt = "";
                cat.rows[rel] = row;
                plan.adopted.push(rel);
                continue;
            }
        }
        (isText(rel) && entry.size <= MCP_LIMIT ? plan.mcp : plan.manual).push(rel);
    }

    for (const rel of Object.keys(cat.rows).sort()) {
        if (!cat.rows[rel].removedAt && !(toProjectPath(cat, rel) in listing)) {
            plan.removed.push(rel);
        }
    }

    saveCatalogue(folder, cat);
    savePlan(out, plan);
    printJson(summary(plan));
};

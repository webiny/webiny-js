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
export const TEXT_EXTENSIONS = new Set([
    ".html",
    ".htm",
    ".css",
    ".js",
    ".mjs",
    ".json",
    ".md",
    ".txt",
    ".svg"
]);
export const DEFAULT_EXCLUDE = [".thumbnail", "design_handoff_*/**"];
export const DEFAULT_SUPPORT = ["_ds/**", "support.js", "assets/**"];
export const ANSWERS_PATH = "answers.md";

export class DesignError extends Error {}

/** A map keyed by untrusted paths: no prototype, so names like "constructor" or "__proto__" are plain keys. */
export const dict = <T>(): Record<string, T> => Object.create(null);

export const own = <T>(record: Record<string, T>, key: string): T | undefined =>
    Object.hasOwn(record, key) ? record[key] : undefined;

// ---------------------------------------------------------------- time

export const nowIso = (): string => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

export const parseIso = (value: string): Date => new Date(value);

/**
 * pulled_at for a file just written or adopted: strictly later than the file's mtime, with milliseconds,
 * so only files placed after the pull can later look newer than their row.
 */
export const stampAfter = (file: string): string =>
    new Date(Math.max(Date.now(), Math.ceil(fs.statSync(file).mtimeMs) + 1)).toISOString();

export const today = (): string => {
    const date = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// ---------------------------------------------------------------- paths

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;

// Control characters, plus characters that are unsafe inside double-quoted shell arguments.
const UNSAFE_CHARS = /[\x00-\x1f\x7f`$"]/;

export const validateRelPath = (rel: string): string => {
    if (
        !rel ||
        rel.startsWith("/") ||
        rel.startsWith("~") ||
        rel.includes("\\") ||
        UNSAFE_CHARS.test(rel)
    ) {
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
    if (isSymlink(root)) {
        throw new DesignError(`symlinked root: ${root}`);
    }
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

export const isText = (rel: string): boolean =>
    TEXT_EXTENSIONS.has(path.extname(rel).toLowerCase());

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
    /** Prefix of this folder's question IDs (QBZ-4); keeps IDs unique across people and worktrees. */
    questionPrefix: string;
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

export const createCatalogue = (
    project: string,
    projectId: string,
    questionPrefix = ""
): Catalogue => ({
    project,
    projectId,
    source: "/",
    exclude: [...DEFAULT_EXCLUDE],
    support: [...DEFAULT_SUPPORT],
    lastPull: "",
    answersEtag: "",
    questionPrefix,
    rows: dict<Row>()
});

const QUESTION_PREFIX = /^[A-Z][A-Z0-9]{0,7}$/;

export const validatePrefix = (prefix: string): string => {
    if (!QUESTION_PREFIX.test(prefix)) {
        throw new DesignError(
            `question prefix must be 1-8 upper-case letters or digits, starting with a letter: ${JSON.stringify(prefix)}`
        );
    }
    return prefix;
};

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

export const kindFor = (cat: Catalogue, rel: string): Kind =>
    matches(rel, cat.support) ? "support" : "screen";

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

const TABLE_HEADER = `| ${COLUMNS.join(" | ")} |`;

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
    const valueOf = (name: string): string =>
        typeof data[name] === "string" ? (data[name] as string) : "";
    const list = (name: string): string[] =>
        Array.isArray(data[name]) ? (data[name] as string[]) : [];
    const cat: Catalogue = {
        project: valueOf("project"),
        projectId: valueOf("project_id"),
        source: valueOf("source") || "/",
        exclude: list("exclude"),
        support: list("support"),
        lastPull: valueOf("last_pull"),
        questionPrefix: valueOf("question_prefix"),
        answersEtag: valueOf("answers_etag"),
        rows: dict<Row>()
    };
    for (const line of lines.slice(end + 1)) {
        if (!line.startsWith("| ") || line === TABLE_HEADER) {
            continue;
        }
        const [
            file,
            kind,
            etagPulled,
            pulledAt,
            etagImplemented,
            implementedAt,
            commit,
            removedAt
        ] = splitRow(line);
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
        `question_prefix: ${cat.questionPrefix}`,
        "---",
        "",
        TABLE_HEADER,
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
    path?: unknown;
    type?: unknown;
    size?: unknown;
    etag?: unknown;
}

export const loadListing = (file: string): Listing => {
    const text = fs.readFileSync(file, "utf8");
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start < 0 || end < start) {
        throw new DesignError(`${file}: no JSON array found`);
    }
    let entries: unknown;
    try {
        entries = JSON.parse(text.slice(start, end + 1));
    } catch (error) {
        throw new DesignError(`${file}: invalid JSON: ${(error as Error).message}`);
    }
    if (!Array.isArray(entries)) {
        throw new DesignError(`${file}: not a JSON array`);
    }
    const listing: Listing = dict<ListingEntry>();
    for (const entry of entries as RawListingEntry[]) {
        if ((entry?.type ?? "file") !== "file") {
            continue;
        }
        const size = Number(entry.size);
        const etagValid = typeof entry.etag === "string" || typeof entry.etag === "number";
        if (
            typeof entry.path !== "string" ||
            !entry.path ||
            !Number.isFinite(size) ||
            size < 0 ||
            !etagValid
        ) {
            throw new DesignError(
                `${file}: not a list_files result (bad entry ${JSON.stringify(entry)})`
            );
        }
        listing[entry.path] = { size, etag: String(entry.etag) };
    }
    return listing;
};

// ---------------------------------------------------------------- commands: folders

export const cmdInit = (
    folderArg: string,
    project: string,
    projectId: string,
    questionPrefix: string
): void => {
    for (const [name, value] of [
        ["project", project],
        ["project id", projectId]
    ]) {
        if (!value || CONTROL_CHARS.test(value)) {
            throw new DesignError(`${name} must be non-empty and without control characters`);
        }
    }
    validatePrefix(questionPrefix);
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
    saveCatalogue(folder, createCatalogue(project, projectId, questionPrefix));
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

export const cmdSetPrefix = (folder: string, questionPrefix: string): void => {
    validatePrefix(questionPrefix);
    const cat = loadCatalogue(folder);
    cat.questionPrefix = questionPrefix;
    saveCatalogue(folder, cat);
    printJson({ question_prefix: questionPrefix });
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
    answered: string[];
    changed: string[];
    unknown: string[];
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
    /** Files that had no row, or a removed row, before this pull. */
    new: string[];
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

export const cmdPlan = (folder: string, listingFile: string, out: string, force = false): void => {
    const cat = loadCatalogue(folder);
    if (fs.existsSync(out)) {
        throw new DesignError(
            `${out} already exists; run plan once per pull, in a new run directory`
        );
    }
    const listing = loadListing(listingFile);
    if (Object.keys(listing).length === 0) {
        throw new DesignError(`${listingFile}: the listing is empty`);
    }
    const liveRows = Object.keys(cat.rows).filter(rel => !cat.rows[rel].removedAt);
    const matched = liveRows.some(rel => Object.hasOwn(listing, toProjectPath(cat, rel)));
    if (liveRows.length > 0 && !matched && !force) {
        throw new DesignError(
            `${listingFile} matches none of the ${liveRows.length} catalogued files; wrong project? Use --force only if every file really was removed`
        );
    }
    const plan: PullPlan = {
        listed_at: nowIso(),
        entries: dict<ListingEntry>(),
        adopted: [],
        mcp: [],
        manual: [],
        unchanged: [],
        removed: [],
        excluded: [],
        rejected: [],
        new: [],
        answers: own(listing, ANSWERS_PATH) ?? null,
        imported: [],
        failed: [],
        reconciled: [],
        answers_result: null
    };

    const candidates: Listing = dict<ListingEntry>();
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
            const row = own(cat.rows, rel);
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
        let row: Row | undefined = own(cat.rows, rel);
        if (row) {
            row.kind = kind;
        }
        const local = localFile(folder, rel);
        const isNew = !row || Boolean(row.removedAt);
        if (isNew) {
            plan.new.push(rel);
        }
        if (row && !isNew && row.etagPulled === entry.etag && local) {
            plan.unchanged.push(rel);
            continue;
        }
        if (local && fs.statSync(local).size === entry.size) {
            const placedAfterPull =
                !row ||
                !row.pulledAt ||
                fs.statSync(local).mtimeMs > parseIso(row.pulledAt).getTime();
            if (placedAfterPull) {
                row = row ?? createRow(rel);
                row.kind = kind;
                row.etagPulled = entry.etag;
                row.pulledAt = stampAfter(local);
                row.removedAt = "";
                cat.rows[rel] = row;
                plan.adopted.push(rel);
                continue;
            }
        }
        (isText(rel) && entry.size <= MCP_LIMIT ? plan.mcp : plan.manual).push(rel);
    }

    for (const rel of Object.keys(cat.rows).sort()) {
        if (!cat.rows[rel].removedAt && !Object.hasOwn(listing, toProjectPath(cat, rel))) {
            plan.removed.push(rel);
        }
    }

    saveCatalogue(folder, cat);
    savePlan(out, plan);
    printJson(summary(plan));
};

const WRAPPER_OPEN = /^<untrusted-project-content((?:\s+[\w-]+="[^"]*")*)\s*>\n/;
const WRAPPER_CLOSE = "\n</untrusted-project-content>";
const ATTR = /([\w-]+)="([^"]*)"/g;
const BODY_ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">" };
const ATTR_ENTITIES: Record<string, string> = { ...BODY_ENTITIES, quot: '"', "#39": "'" };

/** The server escapes exactly &, < and >; one pass over those three entities restores the original. */
const decodeBody = (text: string): string =>
    text.replace(/&(amp|lt|gt);/g, (_, name: string) => BODY_ENTITIES[name]);

const decodeAttr = (text: string): string =>
    text.replace(/&(amp|lt|gt|quot|#39);/g, (_, name: string) => ATTR_ENTITIES[name]);

export interface WrapperContent {
    attrs: Record<string, string>;
    data: Buffer;
}

export const parseWrapper = (text: string): WrapperContent => {
    const open = WRAPPER_OPEN.exec(text);
    if (!open) {
        throw new DesignError("read result: opening wrapper tag not found");
    }
    const bodyStart = open[0].length;
    const end = text.lastIndexOf(WRAPPER_CLOSE);
    if (end < bodyStart - 1) {
        throw new DesignError("read result: closing wrapper tag not found");
    }
    const attrs: Record<string, string> = {};
    for (const match of open[1].matchAll(ATTR)) {
        attrs[match[1]] = decodeAttr(match[2]);
    }
    const body = end >= bodyStart ? text.slice(bodyStart, end) : "";
    return { attrs, data: Buffer.from(decodeBody(body), "utf8") };
};

export interface ImportRawOptions {
    folder: string;
    raw: string;
    plan: string;
    listing?: string;
    answers: boolean;
    retyped: boolean;
    retry: boolean;
}

/** Exit codes of import-raw. */
export const IMPORT_EXIT = {
    imported: 0,
    size_mismatch: 2,
    etag_unknown: 3,
    manual: 4,
    failed: 5
} as const;

type ImportStatus = keyof typeof IMPORT_EXIT;

const expectedEntry = (
    entry: ListingEntry | null | undefined,
    etag: string,
    listingFile: string | undefined,
    projectPath: string
): { expected: ListingEntry | null; usedListing: boolean } => {
    if (entry && entry.etag === etag) {
        return { expected: entry, usedListing: false };
    }
    if (!listingFile) {
        return { expected: null, usedListing: false };
    }
    const listing = loadListing(listingFile);
    const found = own(listing, projectPath);
    return { expected: found && found.etag === etag ? found : null, usedListing: true };
};

export const cmdImportRaw = (options: ImportRawOptions): number => {
    const cat = loadCatalogue(options.folder);
    const plan = loadPlan(options.plan);
    const { attrs, data } = parseWrapper(fs.readFileSync(options.raw, "utf8"));
    const projectPath = attrs.path ?? "";
    const etag = attrs.etag ?? "";

    let key: string;
    let entry: ListingEntry | null | undefined;
    if (options.answers) {
        if (projectPath !== ANSWERS_PATH) {
            throw new DesignError(
                `--answers expects ${ANSWERS_PATH}, got ${JSON.stringify(projectPath)}`
            );
        }
        key = ANSWERS_PATH;
        entry = plan.answers;
    } else {
        const rel = toSourceRel(cat, projectPath);
        if (rel === null) {
            throw new DesignError(
                `${JSON.stringify(projectPath)} is outside source ${JSON.stringify(cat.source)}`
            );
        }
        key = validateRelPath(rel);
        entry = own(plan.entries, key);
        if (!entry) {
            throw new DesignError(
                `${JSON.stringify(key)} is not in this plan; only fetch files listed under mcp`
            );
        }
    }

    const finish = (status: ImportStatus): number => {
        const record = { imported: plan.imported, failed: plan.failed, manual: plan.manual }[
            status as "imported" | "failed" | "manual"
        ];
        if (record && !record.includes(key)) {
            record.push(key);
        }
        savePlan(options.plan, plan);
        printJson({ path: key, status });
        return IMPORT_EXIT[status];
    };

    if (options.retyped && data.length > MCP_MAX_FILE) {
        return finish("manual");
    }
    const { expected, usedListing } = expectedEntry(entry, etag, options.listing, projectPath);
    if (!expected) {
        return finish(usedListing ? "failed" : "etag_unknown");
    }
    if (data.length !== expected.size) {
        return finish(options.retyped && !options.retry ? "size_mismatch" : "failed");
    }

    if (options.answers) {
        atomicWriteBytes(path.join(options.folder, ANSWERS_PATH), data);
        cat.answersEtag = etag;
    } else {
        const target = safeJoin(path.join(options.folder, "files"), key);
        atomicWriteBytes(target, data);
        const row = own(cat.rows, key) ?? createRow(key);
        row.kind = kindFor(cat, key);
        row.etagPulled = etag;
        row.pulledAt = stampAfter(target);
        row.removedAt = "";
        cat.rows[key] = row;
    }
    saveCatalogue(options.folder, cat);
    return finish("imported");
};

/** POSIX shell quoting, same rules as Python's shlex.quote. */
export const shellQuote = (value: string): string => {
    if (value === "") {
        return "''";
    }
    if (/^[\w@%+=:,./-]+$/.test(value)) {
        return value;
    }
    return `'${value.replace(/'/g, `'"'"'`)}'`;
};

const TEMP_FILE = /^\.tmp-[0-9a-f]{12}$/;

/** Removes temp files that atomicWriteBytes left behind when a run was interrupted. */
const removeTempFiles = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            removeTempFiles(full);
        } else if (entry.isFile() && TEMP_FILE.test(entry.name)) {
            fs.rmSync(full);
        }
    }
};

export const cmdFinish = (folder: string, planFile: string): void => {
    const cat = loadCatalogue(folder);
    const plan = loadPlan(planFile);
    for (const rel of plan.removed) {
        const row = own(cat.rows, rel);
        if (!row || row.removedAt) {
            continue;
        }
        row.removedAt = nowIso();
        const mirrored = localFile(folder, rel);
        if (mirrored) {
            // Moved aside instead of deleted: a wrong listing must never destroy unzipped files.
            const aside = safeJoin(path.join(folder, ".removed"), rel);
            fs.mkdirSync(path.dirname(aside), { recursive: true });
            fs.renameSync(mirrored, aside);
        }
    }
    for (const rel of Object.keys(cat.rows).sort()) {
        const row = cat.rows[rel];
        if (
            row.kind !== "screen" ||
            row.removedAt ||
            !row.etagImplemented ||
            row.etagImplemented === row.etagPulled
        ) {
            continue;
        }
        const current = localFile(folder, rel);
        let snapshot: string;
        try {
            snapshot = safeJoin(path.join(folder, ".implemented"), rel);
        } catch (error) {
            if (error instanceof DesignError) {
                continue;
            }
            throw error;
        }
        if (!current || !isRegularFile(snapshot)) {
            continue;
        }
        if (fs.readFileSync(current).equals(fs.readFileSync(snapshot))) {
            row.etagImplemented = row.etagPulled;
            plan.reconciled.push(rel);
        }
    }
    removeTempFiles(folder);
    cat.lastPull = plan.listed_at;
    saveCatalogue(folder, cat);
    savePlan(planFile, plan);
    printJson({ removed: plan.removed, reconciled: plan.reconciled, last_pull: cat.lastPull });
};

export const cmdReport = (folder: string, planFile: string): void => {
    const cat = loadCatalogue(folder);
    const plan = loadPlan(planFile);
    const lines: string[] = [];
    const section = (title: string, items: string[]) => {
        if (items.length) {
            lines.push(`${title}:`, ...items.map(item => `  - ${item}`));
        }
    };
    const ids = (values: string[] | undefined) => (values ?? []).map(id => `Q${id}`);

    const isNew = new Set(plan.new);
    const pulled = [
        ...plan.adopted.map(rel => ({ rel, how: "adopted from unzipped files" })),
        ...plan.imported
            .filter(rel => rel !== ANSWERS_PATH)
            .map(rel => ({ rel, how: "downloaded" }))
    ];
    section(
        "New",
        pulled.filter(item => isNew.has(item.rel)).map(item => `${item.rel} (${item.how})`)
    );
    section(
        "Changed",
        pulled.filter(item => !isNew.has(item.rel)).map(item => `${item.rel} (${item.how})`)
    );
    section("Removed", plan.removed);
    section("Excluded", plan.excluded);
    section("Etag changed, content identical", plan.reconciled);
    const pending = Object.keys(cat.rows)
        .filter(rel => rowStatus(cat, cat.rows[rel]) === "pending")
        .sort();
    if (pending.length) {
        lines.push("Pending (design changed since implementation), run from the design folder:");
        for (const rel of pending) {
            lines.push(
                `  - ${rel}`,
                `      diff ${shellQuote(`.implemented/${rel}`)} ${shellQuote(`files/${rel}`)}`
            );
        }
    }
    section("Newly answered", ids(plan.answers_result?.answered));
    section("Answer changed", ids(plan.answers_result?.changed));
    section("Answers without a logged question", ids(plan.answers_result?.unknown));
    section("Needs manual export (unzip into files/ and pull again)", plan.manual);
    const settled = new Set([...plan.imported, ...plan.failed, ...plan.manual]);
    section(
        "Not fetched",
        plan.mcp.filter(rel => !settled.has(rel))
    );
    section("Failed", plan.failed);
    section("Rejected paths", plan.rejected);
    process.stdout.write(`${lines.length ? lines.join("\n") : "Nothing changed."}\n`);
};

// ---------------------------------------------------------------- questions

export interface Question {
    /** Prefixed ID without the Q, for example "BZ-4". */
    id: string;
    status: "open" | "answered";
    date: string;
    file: string;
    text: string;
    answer: string;
}

const QUESTION_HEAD = /^## Q([A-Z][A-Z0-9]*-\d+) — (open|answered) — (\d{4}-\d{2}-\d{2})$/;
const ANSWER_HEAD = /^#{2,3}[ \t]+Q([A-Z][A-Z0-9]*-\d+)\b.*$/gm;
const ESCAPED_START = ["#", ">", "file:", "\\"];

const idNumber = (id: string): number => Number(id.slice(id.lastIndexOf("-") + 1));

const idPrefix = (id: string): string => id.slice(0, id.lastIndexOf("-"));

export const normalize = (text: string): string =>
    text
        .trim()
        .split("\n")
        .map(line => line.trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n");

const escapeLine = (line: string): string =>
    ESCAPED_START.some(start => line.startsWith(start)) ? `\\${line}` : line;

const unescapeLine = (line: string): string => (line.startsWith("\\") ? line.slice(1) : line);

export const parseQuestions = (text: string): Question[] => {
    const questions: Question[] = [];
    let current: Question | null = null;
    let body: string[] = [];
    let answer: string[] = [];
    const close = () => {
        if (current) {
            current.text = normalize(body.join("\n"));
            current.answer = answer.join("\n").replace(/^\n+|\n+$/g, "");
        }
    };
    for (const line of text.split("\n")) {
        const head = QUESTION_HEAD.exec(line);
        if (head) {
            close();
            current = {
                id: head[1],
                status: head[2] as Question["status"],
                date: head[3],
                file: "",
                text: "",
                answer: ""
            };
            questions.push(current);
            body = [];
            answer = [];
            continue;
        }
        if (!current) {
            continue;
        }
        if (line.startsWith("file: ") && body.length === 0 && !current.file) {
            current.file = line.slice(6);
        } else if (line.startsWith(">")) {
            answer.push(line.startsWith("> ") ? line.slice(2) : line.slice(1));
        } else {
            body.push(unescapeLine(line));
        }
    }
    close();
    return questions;
};

export const renderQuestions = (questions: Question[]): string => {
    const out = ["# Questions", ""];
    const sorted = [...questions].sort(
        (a, b) => idPrefix(a.id).localeCompare(idPrefix(b.id)) || idNumber(a.id) - idNumber(b.id)
    );
    for (const question of sorted) {
        out.push(`## Q${question.id} — ${question.status} — ${question.date}`);
        if (question.file) {
            out.push(`file: ${question.file}`);
        }
        out.push("", ...question.text.split("\n").map(escapeLine));
        if (question.answer) {
            out.push("", ...question.answer.split("\n").map(line => (line ? `> ${line}` : ">")));
        }
        out.push("");
    }
    return out.join("\n");
};

/** Answer sections keyed by prefixed question ID; when an ID repeats, the last section wins. */
export const parseAnswers = (text: string): Map<string, string> => {
    const sections = new Map<string, string>();
    const heads = [...text.matchAll(ANSWER_HEAD)];
    heads.forEach((head, index) => {
        const start = (head.index ?? 0) + head[0].length;
        const end =
            index + 1 < heads.length ? (heads[index + 1].index ?? text.length) : text.length;
        sections.set(head[1], normalize(text.slice(start, end)));
    });
    return sections;
};

const loadQuestions = (folder: string): Question[] => {
    const file = path.join(folder, "questions.md");
    return isRegularFile(file) ? parseQuestions(fs.readFileSync(file, "utf8")) : [];
};

const saveQuestions = (folder: string, questions: Question[]): void => {
    atomicWriteBytes(path.join(folder, "questions.md"), renderQuestions(questions));
};

const answerIds = (folder: string): string[] => {
    const file = path.join(folder, ANSWERS_PATH);
    return isRegularFile(file) ? [...parseAnswers(fs.readFileSync(file, "utf8")).keys()] : [];
};

/** The folder's question prefix; fails when the catalogue is missing or has none. */
const questionPrefixOf = (folder: string): string => {
    const prefix = loadCatalogue(folder).questionPrefix;
    if (!prefix) {
        throw new DesignError(`no question_prefix in ${folder}/catalogue.md; run set-prefix first`);
    }
    return prefix;
};

// ---------------------------------------------------------------- commands: questions

interface AskItem {
    file?: string;
    text: string;
}

const readAskItems = (itemsFile: string): AskItem[] => {
    let items: unknown;
    try {
        items = JSON.parse(fs.readFileSync(itemsFile, "utf8"));
    } catch (error) {
        throw new DesignError(`${itemsFile}: invalid JSON: ${(error as Error).message}`);
    }
    if (!Array.isArray(items) || items.some(item => typeof item?.text !== "string")) {
        throw new DesignError(`${itemsFile}: expected [{"file": "...", "text": "..."}]`);
    }
    return items as AskItem[];
};

export const cmdAskAdd = (folder: string, itemsFile: string): void => {
    const prefix = questionPrefixOf(folder);
    const items = readAskItems(itemsFile);
    const questions = loadQuestions(folder);
    const openByText = new Map(questions.filter(q => q.status === "open").map(q => [q.text, q.id]));
    const ownIds = [...questions.map(q => q.id), ...answerIds(folder)].filter(
        id => idPrefix(id) === prefix
    );
    let next = Math.max(0, ...ownIds.map(idNumber));
    const added: Array<{ id: string; file: string; text: string }> = [];
    const duplicates: Array<{ id: string; text: string }> = [];
    for (const item of items) {
        const text = normalize(item.text);
        if (!text) {
            continue;
        }
        const existing = openByText.get(text);
        if (existing !== undefined) {
            duplicates.push({ id: existing, text });
            continue;
        }
        next += 1;
        const id = `${prefix}-${next}`;
        const file = item.file ?? "";
        questions.push({ id, status: "open", date: today(), file, text, answer: "" });
        openByText.set(text, id);
        added.push({ id, file, text });
    }
    if (added.length) {
        saveQuestions(folder, questions);
    }
    printJson({ added, duplicates });
};

export const cmdAskOpen = (folder: string): void => {
    loadCatalogue(folder);
    printJson(
        loadQuestions(folder)
            .filter(q => q.status === "open")
            .map(q => ({ id: q.id, file: q.file, text: q.text }))
    );
};

export const cmdAnswers = (folder: string, planFile?: string): void => {
    const prefix = loadCatalogue(folder).questionPrefix;
    const result: AnswersResult = { answered: [], changed: [], unknown: [] };
    const file = path.join(folder, ANSWERS_PATH);
    if (isRegularFile(file)) {
        const questions = loadQuestions(folder);
        const byId = new Map(questions.map(q => [q.id, q]));
        const sections = [...parseAnswers(fs.readFileSync(file, "utf8")).entries()]
            .filter(([id]) => idPrefix(id) === prefix)
            .sort(([a], [b]) => idNumber(a) - idNumber(b));
        for (const [id, body] of sections) {
            if (!body) {
                continue;
            }
            const question = byId.get(id);
            if (!question) {
                result.unknown.push(id);
            } else if (question.status === "open") {
                question.status = "answered";
                question.date = today();
                question.answer = body;
                result.answered.push(id);
            } else if (normalize(question.answer) !== body) {
                question.date = today();
                question.answer = body;
                result.changed.push(id);
            }
        }
        if (result.answered.length || result.changed.length) {
            saveQuestions(folder, questions);
        }
    }
    if (planFile) {
        const plan = loadPlan(planFile);
        plan.answers_result = result;
        savePlan(planFile, plan);
    }
    printJson(result);
};

// ---------------------------------------------------------------- commands: mark

interface MarkResult {
    done: string[];
    skipped: Array<{ file: string; reason: string }>;
    warnings: string[];
}

export const cmdMark = (
    folder: string,
    names: string[],
    etag?: string,
    commitArg?: string
): void => {
    const cat = loadCatalogue(folder);
    const top = repoTop(folder);
    const result: MarkResult = { done: [], skipped: [], warnings: [] };
    let commit = commitArg;
    if (!commit) {
        commit = git(top, "rev-parse", "HEAD");
        if (git(top, "status", "--porcelain")) {
            result.warnings.push(
                "working tree has uncommitted changes; HEAD may not contain the implementation"
            );
        }
    }
    for (const name of names) {
        const row = own(cat.rows, name);
        if (!row) {
            result.skipped.push({ file: name, reason: "no catalogue row" });
            continue;
        }
        const status = rowStatus(cat, row);
        if (row.kind !== "screen" || status === "removed" || status === "excluded") {
            result.skipped.push({ file: name, reason: `status is ${status}` });
            continue;
        }
        const source = localFile(folder, name);
        if (!source) {
            result.skipped.push({ file: name, reason: "files/ copy is missing" });
            continue;
        }
        if (etag && etag !== row.etagPulled) {
            result.skipped.push({
                file: name,
                reason: `a newer version was pulled: implemented ${etag}, pending ${row.etagPulled}`
            });
            continue;
        }
        try {
            atomicWriteBytes(
                safeJoin(path.join(folder, ".implemented"), name),
                fs.readFileSync(source)
            );
        } catch (error) {
            result.skipped.push({ file: name, reason: (error as Error).message });
            continue;
        }
        row.etagImplemented = row.etagPulled;
        row.implementedAt = nowIso();
        row.commit = commit;
        result.done.push(name);
    }
    saveCatalogue(folder, cat);
    printJson(result);
};

export const cmdUnmark = (folder: string, names: string[]): void => {
    const cat = loadCatalogue(folder);
    const result: MarkResult = { done: [], skipped: [], warnings: [] };
    for (const name of names) {
        const row = own(cat.rows, name);
        if (!row || !row.etagImplemented) {
            result.skipped.push({ file: name, reason: "not marked" });
            continue;
        }
        try {
            fs.rmSync(safeJoin(path.join(folder, ".implemented"), name), { force: true });
        } catch (error) {
            result.skipped.push({ file: name, reason: (error as Error).message });
            continue;
        }
        row.etagImplemented = "";
        row.implementedAt = "";
        row.commit = "";
        result.done.push(name);
    }
    saveCatalogue(folder, cat);
    printJson(result);
};

// Copies the replay recordings an /e2e run uploaded into e2e/cache/, so they can be reviewed and
// committed. The WCP shards record from a freshly installed project and upload only the entries
// they added or changed, one `e2e-cache-*` artifact per shard.
//
// Usage: yarn e2e:pull-cache <run id or run URL>

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = join(import.meta.dirname, "..", "cache");

const parseRunId = value => {
    if (/^\d+$/.test(value ?? "")) {
        return value;
    }
    return value?.match(/\/actions\/runs\/(\d+)/)?.[1];
};

// Entry files are named by key digest; the test they belong to is inside.
const describeEntry = file => {
    try {
        const { payload } = JSON.parse(readFileSync(file, "utf8"));
        return decodeURIComponent(payload.recordedFor.testId).replaceAll("::", " > ");
    } catch {
        return "(unreadable entry)";
    }
};

const runId = parseRunId(process.argv[2]);
if (!runId) {
    console.error("Usage: yarn e2e:pull-cache <run id or run URL>");
    process.exit(2);
}

const downloadDir = mkdtempSync(join(tmpdir(), "e2e-cache-"));

try {
    try {
        execFileSync(
            "gh",
            ["run", "download", runId, "--pattern", "e2e-cache-*", "--dir", downloadDir],
            { stdio: ["ignore", "ignore", "pipe"] }
        );
    } catch (error) {
        const stderr = String(error.stderr ?? "");
        // An artifact is uploaded only when a shard recorded something.
        if (/no valid artifacts found|no artifact matches/i.test(stderr)) {
            console.log(`Run ${runId} uploaded no new replay recordings. Nothing to pull.`);
            process.exit(0);
        }
        console.error(stderr.trim() || error.message);
        process.exit(1);
    }

    // `gh run download` puts each artifact in a folder of its own name. Two shards can record the
    // same step (SQLite and Postgres run the same tests); either recording is valid, so the last
    // one copied wins.
    const pulled = new Map();
    for (const artifact of readdirSync(downloadDir)) {
        for (const name of readdirSync(join(downloadDir, artifact))) {
            pulled.set(name, join(downloadDir, artifact, name));
        }
    }

    // Entries with uncommitted local changes, usually recordings from a local run. CI's recording
    // replaces them on purpose (see e2e/README.md, "Recording locally"), but say so: the local
    // version is not in git and is gone after this.
    const uncommitted = new Set(
        execFileSync("git", ["status", "--porcelain", "--untracked-files=all", "--", CACHE_DIR], {
            encoding: "utf8"
        })
            .split("\n")
            .filter(Boolean)
            .map(line => line.slice(3).split("/").pop())
    );

    let added = 0;
    let changed = 0;
    let replacedLocal = 0;
    for (const [name, source] of pulled) {
        const target = join(CACHE_DIR, name);
        const status = !existsSync(target)
            ? "added"
            : readFileSync(target, "utf8") === readFileSync(source, "utf8")
              ? "unchanged"
              : "changed";
        if (status === "unchanged") {
            continue;
        }
        const local = uncommitted.has(name);
        copyFileSync(source, target);
        status === "added" ? added++ : changed++;
        replacedLocal += local ? 1 : 0;
        const note = local ? "  (replaced an uncommitted local entry)" : "";
        console.log(`${status.padEnd(7)}  ${describeEntry(target)}${note}`);
    }

    console.log(
        `\n${added} added, ${changed} changed in e2e/cache/` +
            (replacedLocal ? `, ${replacedLocal} of them over uncommitted local entries` : "") +
            '. Check them as e2e/README.md describes ("Replay cache"), then commit.'
    );
} finally {
    rmSync(downloadDir, { recursive: true, force: true });
}

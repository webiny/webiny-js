// Assigns the `x.y.z` milestone to every merged PR that has reached `release/x.y.z`.
//
// Most work is merged into `next` and only reaches a release branch when `next` is merged into it,
// so no PR ever targets the release branch and `assignMilestone` (which keys off a PR's base
// branch) never sees it. This script works from the branch contents instead: it reads the PR
// numbers out of the commits between the previous release tag and HEAD, and milestones the ones
// that have none.
//
// A PR whose number already appears in the previous release's history is skipped. Those are fixes
// that were cherry-picked into that release and later reached `next` under the same number.
// A milestone somebody set by hand is never overridden.
//
// Safe to run any number of times; each run only touches PRs that still have no milestone.
//
// Inputs (all via env):
//   VERSION  - the release version, e.g. `6.6.0`. Anything that is not `x.y.z` exits 0.
//   REPO     - `owner/name`.
//   GH_TOKEN - token for `gh`, with `issues: write` and `pull-requests: write`.
//   DRY_RUN  - optional; when `true`, reports what would change and writes nothing.
import { execFileSync } from "node:child_process";

const { VERSION, REPO, DRY_RUN } = process.env;
const dryRun = DRY_RUN === "true";

const run = (cmd, args) => {
    return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
};

const parseVersion = value => {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value);
    if (!match) {
        return null;
    }
    return match.slice(1, 4).map(Number);
};

const compareVersions = (a, b) => {
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) {
            return a[i] - b[i];
        }
    }
    return 0;
};

// Squash merges end their subject with `(#123)`, merge commits start it with `Merge pull request #123`.
const listPrNumbers = range => {
    const subjects = run("git", ["log", "--format=%s", range]).split("\n");
    const numbers = new Set();
    for (const subject of subjects) {
        const match = /\(#(\d+)\)\s*$/.exec(subject) || /^Merge pull request #(\d+)/.exec(subject);
        if (match) {
            numbers.add(Number(match[1]));
        }
    }
    return numbers;
};

const findPreviousReleaseTag = target => {
    const tags = run("git", ["tag", "--list", "v*"]).split("\n");
    let previous = null;
    for (const tag of tags) {
        const version = parseVersion(tag);
        if (!version || compareVersions(version, target) >= 0) {
            continue;
        }
        if (!previous || compareVersions(version, previous.version) > 0) {
            previous = { tag, version };
        }
    }
    return previous;
};

const fetchPullRequests = numbers => {
    const [owner, name] = REPO.split("/");
    const pullRequests = [];
    for (let i = 0; i < numbers.length; i += 50) {
        const fields = numbers
            .slice(i, i + 50)
            .map(number => {
                return `pr${number}: pullRequest(number: ${number}) { number merged milestone { title } }`;
            })
            .join("\n");
        const query = `query { repository(owner: "${owner}", name: "${name}") { ${fields} } }`;
        // A number that belongs to an issue resolves to null and is reported in `errors`,
        // which `gh` turns into a non-zero exit. Read the output either way.
        let output;
        try {
            output = run("gh", ["api", "graphql", "-f", `query=${query}`]);
        } catch (e) {
            output = e.stdout;
        }
        const { data, errors = [] } = JSON.parse(output);
        // Anything other than "this number is not a PR" means the batch is incomplete.
        const unexpected = errors.filter(error => {
            return error.type !== "NOT_FOUND" || !/^pr\d+$/.test(error.path?.[1] || "");
        });
        if (unexpected.length || !data?.repository) {
            throw new Error(
                `GraphQL query failed: ${JSON.stringify(unexpected.length ? unexpected : errors)}`
            );
        }
        pullRequests.push(...Object.values(data.repository).filter(Boolean));
    }
    return pullRequests;
};

const resolveMilestoneNumber = () => {
    const milestones = JSON.parse(
        run("gh", [
            "api",
            "--paginate",
            "--slurp",
            `repos/${REPO}/milestones?state=all&per_page=100`
        ])
    ).flat();
    const existing = milestones.find(milestone => milestone.title === VERSION);
    if (existing) {
        return existing.number;
    }
    if (dryRun) {
        return null;
    }
    console.log(`Milestone "${VERSION}" not found - creating it.`);
    const created = JSON.parse(
        run("gh", ["api", `repos/${REPO}/milestones`, "--method", "POST", "-f", `title=${VERSION}`])
    );
    return created.number;
};

const target = parseVersion(VERSION || "");
if (!target) {
    console.log(`"${VERSION}" is not an x.y.z version - skipping.`);
    process.exit(0);
}

const previous = findPreviousReleaseTag(target);
if (!previous) {
    console.log(`No release tag older than ${VERSION} - skipping.`);
    process.exit(0);
}

const released = listPrNumbers(previous.tag);
const candidates = [...listPrNumbers(`${previous.tag}..HEAD`)].filter(n => !released.has(n));
console.log(`${candidates.length} PRs reached ${VERSION} since ${previous.tag}.`);

const unassigned = fetchPullRequests(candidates).filter(pr => pr.merged && !pr.milestone);
if (unassigned.length === 0) {
    console.log("Every one of them already has a milestone.");
    process.exit(0);
}

const milestoneNumber = resolveMilestoneNumber();
for (const pr of unassigned) {
    if (dryRun) {
        console.log(`Would assign "${VERSION}" to #${pr.number}.`);
        continue;
    }
    run("gh", [
        "api",
        `repos/${REPO}/issues/${pr.number}`,
        "--method",
        "PATCH",
        "-F",
        `milestone=${milestoneNumber}`
    ]);
    console.log(`Assigned "${VERSION}" to #${pr.number}.`);
}

const verb = dryRun ? "Would assign" : "Assigned";
console.log(`${verb} "${VERSION}" to ${unassigned.length} PRs.`);

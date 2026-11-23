/*
 * Checks that the tests follow the areas in `areas.ts` (README.md, "Areas"). Run with
 * `yarn e2e:areas`. Prints every problem it finds and exits 1 when there is one.
 *
 * It reads the tests from `e2e list --reporter json`, which collects them exactly as a run does,
 * and the folders from disk, so a folder without tests is found too.
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { AREAS, partTag } from "../areas.ts";
import type { Area } from "../areas.ts";

const E2E_DIR = join(import.meta.dirname, "..");
const TESTS_DIR = join(E2E_DIR, "tests");

// Names (area names, part tags, aliases) are used as tags and in `/e2e` PR comments.
const NAME_PATTERN = /^[a-z0-9-]+$/;
// Tags that say where a test can run, not what it tests. No area may take these names.
const RESERVED_TAGS = ["wcp", "ai", "installation"];
// A test outside an area folder must be a setup or carry this tag.
const INSTALLATION_TAG = "installation";

interface ListedPair {
    file: string;
    title: string;
    kind: string;
    tags: string[];
}

interface ListOutput {
    pairs: ListedPair[];
}

const listPairs = (): ListedPair[] => {
    const output = execFileSync("yarn", ["e2e", "list", "--reporter", "json"], {
        cwd: E2E_DIR,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024
    });
    const list = JSON.parse(output) as ListOutput;
    return list.pairs;
};

const listFolders = (): string[] => {
    return readdirSync(TESTS_DIR, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
};

const checkNames = (areas: readonly Area[]): string[] => {
    const problems: string[] = [];
    const owners = new Map<string, string>();
    const claim = (name: string, owner: string) => {
        if (!NAME_PATTERN.test(name)) {
            problems.push(`${owner}: "${name}" must match ${NAME_PATTERN}.`);
        }
        if (RESERVED_TAGS.includes(name)) {
            problems.push(`${owner}: "${name}" is a licence or installation tag.`);
        }
        const previous = owners.get(name);
        if (previous) {
            problems.push(`${owner}: "${name}" is already taken by ${previous}.`);
            return;
        }
        owners.set(name, owner);
    };
    const folders = new Set<string>();

    for (const area of areas) {
        claim(area.name, `area ${area.name}`);
        for (const alias of area.aliases || []) {
            claim(alias, `alias of area ${area.name}`);
        }
        for (const part of area.parts || []) {
            claim(partTag(area, part), `part ${part.name} of area ${area.name}`);
            for (const alias of part.aliases || []) {
                claim(alias, `alias of part ${partTag(area, part)}`);
            }
        }
        if (folders.has(area.folder)) {
            problems.push(`area ${area.name}: folder "${area.folder}" belongs to another area.`);
        }
        folders.add(area.folder);
    }

    return problems;
};

const checkTests = (areas: readonly Area[], pairs: ListedPair[], folders: string[]): string[] => {
    const problems: string[] = [];
    const areaByFolder = new Map(areas.map(area => [area.folder, area]));
    // Every area and part tag, to find a test that carries another area's tag.
    const allAreaTags = new Set<string>();
    for (const area of areas) {
        allAreaTags.add(area.name);
        for (const part of area.parts || []) {
            allAreaTags.add(partTag(area, part));
        }
    }
    const testCounts = new Map<string, number>();
    const licenceTags = new Map<string, Set<string>>();

    for (const folder of folders) {
        if (!areaByFolder.has(folder)) {
            problems.push(`tests/${folder}/ has no entry in areas.ts.`);
        }
    }

    for (const pair of pairs) {
        const segments = pair.file.split("/");
        // `tests/<file>`: outside every area.
        if (segments.length === 2) {
            if (pair.kind !== "setup" && !pair.tags.includes(INSTALLATION_TAG)) {
                problems.push(
                    `${pair.file} › ${pair.title}: put it in an area folder; only setups and the installation test sit in tests/.`
                );
            }
            continue;
        }
        const area = areaByFolder.get(segments[1]);
        if (!area) {
            // Already reported as a folder without an entry.
            continue;
        }
        const where = `${pair.file} › ${pair.title}`;
        const expected = [area.name];
        // `tests/<folder>/<sub>/.../<file>`: the first sub-folder is a part, if the area declares it.
        const part =
            segments.length > 3
                ? (area.parts || []).find(candidate => candidate.name === segments[2])
                : undefined;
        if (segments.length > 3 && !part) {
            problems.push(
                `${where}: tests/${area.folder}/${segments[2]}/ is not a part of ${area.name}.`
            );
        }
        if (part) {
            expected.push(partTag(area, part));
        }

        for (const tag of expected) {
            if (!pair.tags.includes(tag)) {
                problems.push(`${where}: lacks the tag "${tag}".`);
            }
            testCounts.set(tag, (testCounts.get(tag) || 0) + 1);
        }
        for (const tag of pair.tags) {
            if (allAreaTags.has(tag) && !expected.includes(tag)) {
                problems.push(`${where}: carries "${tag}", which belongs to another area or part.`);
            }
        }

        const areaLicenceTags = licenceTags.get(area.name) || new Set<string>();
        for (const tag of pair.tags) {
            if (tag === "wcp" || tag === "ai") {
                areaLicenceTags.add(tag);
            }
        }
        licenceTags.set(area.name, areaLicenceTags);
    }

    for (const area of areas) {
        if (!testCounts.get(area.name)) {
            problems.push(`area ${area.name} has no tests in tests/${area.folder}/.`);
            continue;
        }
        for (const part of area.parts || []) {
            if (!testCounts.get(partTag(area, part))) {
                problems.push(
                    `part ${partTag(area, part)} has no tests in tests/${area.folder}/${part.name}/.`
                );
            }
        }
        const carried = [...(licenceTags.get(area.name) || [])].sort();
        const declared = [...area.needs].sort();
        if (carried.join(",") !== declared.join(",")) {
            problems.push(
                `area ${area.name}: needs is [${declared.join(", ")}], its tests carry [${carried.join(", ")}].`
            );
        }
    }

    return problems;
};

const problems = [...checkNames(AREAS), ...checkTests(AREAS, listPairs(), listFolders())];

if (problems.length > 0) {
    console.error(`${problems.length} problem(s) with the e2e areas:`);
    for (const problem of problems) {
        console.error(`- ${problem}`);
    }
    process.exit(1);
}

console.log(`${AREAS.length} areas, every test in its area.`);

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CAPTURED_EVENTS, OPT_OUT_RULES } from "~/cms/capture/coverage.js";

/**
 * The two coverage guards.
 *
 * Both read the CMS source rather than its types, because the failure they exist to catch is a new
 * write path appearing upstream. A type-level check cannot see a use case that was added without
 * an event, and a runtime check cannot see one whose event nobody subscribed to. Source is the
 * only place both are visible.
 *
 * They resolve the CMS package by relative path, which holds inside the monorepo and is where
 * these guards are meant to run. If the layout ever changes they fail loudly on a missing
 * directory rather than passing vacuously on an empty scan — asserted below.
 */

const CONTENT_ENTRY_DIR = join(
    import.meta.dirname,
    "../../../api-headless-cms/src/features/contentEntry"
);

/** Directories that are entry write use cases, i.e. the ones that must publish events. */
const WRITE_USE_CASES = [
    "CreateEntry",
    "UpdateEntry",
    "CreateEntryRevisionFrom",
    "DeleteEntryRevision",
    "PublishEntry",
    "UnpublishEntry",
    "RepublishEntry",
    "MoveEntry",
    "DeleteEntry",
    "RestoreEntryFromBin",
    "DeleteMultipleEntries",
    "UpdateRevisionDescription"
];

const listFeatureDirs = (): string[] => {
    return readdirSync(CONTENT_ENTRY_DIR).filter(name => {
        try {
            return statSync(join(CONTENT_ENTRY_DIR, name)).isDirectory();
        } catch {
            return false;
        }
    });
};

const readAllSource = (dir: string): string => {
    const parts: string[] = [];

    const walk = (current: string): void => {
        for (const name of readdirSync(current)) {
            const path = join(current, name);

            if (statSync(path).isDirectory()) {
                if (name !== "__tests__") {
                    walk(path);
                }
                continue;
            }

            if (name.endsWith(".ts")) {
                parts.push(readFileSync(path, "utf8"));
            }
        }
    };

    walk(dir);

    return parts.join("\n");
};

const declaredEventTypes = (): string[] => {
    const types = new Set<string>();

    for (const dir of listFeatureDirs()) {
        const source = readAllSource(join(CONTENT_ENTRY_DIR, dir));

        for (const match of source.matchAll(/eventType\s*=\s*"(Cms\/Entry\/[^"]+)"/g)) {
            types.add(match[1]!);
        }
    }

    return [...types].sort();
};

describe("the scan itself", () => {
    it("finds the CMS content entry features, so the guards cannot pass vacuously", () => {
        const dirs = listFeatureDirs();

        expect(dirs.length).toBeGreaterThan(10);
        expect(dirs).toContain("UpdateEntry");
    });

    it("finds a plausible number of declared events", () => {
        expect(declaredEventTypes().length).toBeGreaterThan(20);
    });
});

describe("guard 1 — every entry write use case publishes an event", () => {
    const dirs = listFeatureDirs();

    it.each(WRITE_USE_CASES)("%s declares at least one event", useCase => {
        expect(dirs).toContain(useCase);

        const source = readAllSource(join(CONTENT_ENTRY_DIR, useCase));

        expect(source).toMatch(/eventType\s*=\s*"Cms\/Entry\//);
    });

    it.each(WRITE_USE_CASES)("%s actually publishes what it declares", useCase => {
        const source = readAllSource(join(CONTENT_ENTRY_DIR, useCase));

        // Declaring an event class is not the same as publishing one. MoveEntryToBin is the
        // reminder: it publishes the delete events rather than declaring any of its own.
        expect(source).toMatch(/eventPublisher\.publish\(/);
    });

    it("names every feature directory that declares an event", () => {
        // A directory that declares entry events but is not in WRITE_USE_CASES is a write path
        // this feature has never considered. Failing here forces the decision.
        const declaring = listFeatureDirs().filter(dir =>
            /eventType\s*=\s*"Cms\/Entry\//.test(readAllSource(join(CONTENT_ENTRY_DIR, dir)))
        );

        expect(declaring.sort()).toEqual([...WRITE_USE_CASES].sort());
    });
});

describe("guard 2 — every entry event has a handler or an explicit opt-out", () => {
    const eventTypes = declaredEventTypes();

    const optOutFor = (eventType: string) => OPT_OUT_RULES.find(rule => rule.matches(eventType));

    it.each(eventTypes)("%s is captured or opted out", eventType => {
        const captured = Object.hasOwn(CAPTURED_EVENTS, eventType);
        const optedOut = optOutFor(eventType) !== undefined;

        expect(
            captured || optedOut,
            `"${eventType}" is neither captured nor opted out. If it is a new after-event, add a ` +
                `handler and list it in CAPTURED_EVENTS. Do not widen an opt-out rule to silence ` +
                `this.`
        ).toBe(true);
    });

    it.each(eventTypes)("%s is not both captured and opted out", eventType => {
        const captured = Object.hasOwn(CAPTURED_EVENTS, eventType);
        const optedOut = optOutFor(eventType) !== undefined;

        expect(captured && optedOut).toBe(false);
    });

    it("has no stale entries in CAPTURED_EVENTS", () => {
        // A renamed or removed event would otherwise leave a dead entry that reads as coverage.
        expect(Object.keys(CAPTURED_EVENTS).sort()).toEqual(
            eventTypes.filter(type => Object.hasOwn(CAPTURED_EVENTS, type)).sort()
        );
    });

    it("captures every after-event, which is the set that matters", () => {
        const afterEvents = eventTypes.filter(type => /After/.test(type) && !/Error$/.test(type));

        expect(Object.keys(CAPTURED_EVENTS).sort()).toEqual(afterEvents.sort());
    });

    it("gives every opt-out rule a reason", () => {
        for (const rule of OPT_OUT_RULES) {
            expect(rule.reason.length).toBeGreaterThan(40);
            expect(rule.label).toBeTruthy();
        }
    });
});

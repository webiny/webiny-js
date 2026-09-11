import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { EntryAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { EntryAfterUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { EntryRevisionAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { EntryAfterUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { EntryAfterRepublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/index.js";
import { EntryAfterMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { EntryAfterRestoreFromBinEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RestoreEntryFromBin/index.js";
import { EntryAfterDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { EntryAfterUpdateRevisionDescriptionEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateRevisionDescription/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivitySourceResolver, EntryActivityRecorder } from "~/cms/recorder/abstractions.js";
import { ActivityLogModelProvider } from "~/storage/privateModel/abstractions.js";
import { ActivityLogAppFeature } from "~/ActivityLogAppFeature.js";
import { extractRequiredTokens } from "./extractRequiredTokens.js";

/**
 * Construction is a separate failure mode from execution, and the containment suite cannot see it.
 *
 * `EventPublisher` resolves every handler for an event *before* invoking any of them. A required
 * constructor dependency that is not registered therefore throws during resolution — inside the
 * write, before any guard inside `handle` can run, and before any `try` in the recorder exists to
 * catch it. Every test in the containment suite exercises an already-constructed handler, so none
 * of them can catch this.
 *
 * That is not hypothetical: `PurgeOnEntryDeleted` had `TaskService` as a required dependency, which
 * would have failed every permanent delete in any project without background tasks registered.
 * The `isPrivate` guard inside its `handle` was unreachable.
 *
 * Two guards here. The first constructs everything against the bare minimum. The second reads the
 * source, so a handler that someone forgets to add to the first still cannot introduce a required
 * dependency unnoticed.
 */

/**
 * The platform abstractions the activity log may treat as always present.
 *
 * `IdentityContext` comes from api-core, and the CMS use cases from api-headless-cms — both are
 * unconditional prerequisites: this feature records CMS entry writes, so a project without the CMS
 * has nothing for it to do. Anything *not* on this list must be declared optional.
 */
const ALWAYS_PRESENT = new Set([
    "IdentityContext",
    "CreateEntryUseCase",
    "ListLatestEntriesUseCase",
    "DeleteEntryUseCase",
    "GetModelUseCase",
    "CmsWhereMapper",
    // Reads the target within its model, which both authorises and validates membership.
    // Registered by the CMS, which this feature requires outright.
    "GetLatestRevisionByEntryIdIncludingDeletedUseCase"
]);

/** Abstractions the feature registers itself, so they are present whenever it is. */
const SELF_REGISTERED = new Set([
    "ActivityLogStorage",
    "ActivityLogModelProvider",
    "ActivitySourceResolver",
    "ActivityWriter",
    "EntryActivityRecorder",
    "ReviewActivityRecorder",
    "ActivityLogPermissions",
    "ActivityChangesetFilter",
    "ListActivityUseCase"
]);

/**
 * A container holding only what the feature is entitled to assume.
 *
 * Deliberately registers neither `TaskService` nor `TaskExecutionContext`: a project without
 * background tasks is the configuration that broke, so it is the configuration the test runs.
 */
const minimalContainer = (): Container => {
    const container = new Container();

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({
            id: "u-1",
            type: "admin",
            displayName: "Ada",
            isAnonymous: () => false
        })
    } as unknown as IdentityContext.Interface);

    container.registerInstance(CreateEntryUseCase, {
        execute: vi.fn()
    } as unknown as CreateEntryUseCase.Interface);
    container.registerInstance(ListLatestEntriesUseCase, {
        execute: vi.fn()
    } as unknown as ListLatestEntriesUseCase.Interface);
    container.registerInstance(DeleteEntryUseCase, {
        execute: vi.fn()
    } as unknown as DeleteEntryUseCase.Interface);
    container.registerInstance(GetModelUseCase, {
        execute: vi.fn()
    } as unknown as GetModelUseCase.Interface);
    container.registerInstance(CmsWhereMapper, {
        map: vi.fn()
    } as unknown as CmsWhereMapper.Interface);

    ActivityLogAppFeature.register(container, { enabled: true });

    return container;
};

const EVENT_HANDLERS = [
    ["EntryAfterCreateEventHandler", EntryAfterCreateEventHandler],
    ["EntryAfterUpdateEventHandler", EntryAfterUpdateEventHandler],
    ["EntryRevisionAfterCreateEventHandler", EntryRevisionAfterCreateEventHandler],
    ["EntryRevisionAfterDeleteEventHandler", EntryRevisionAfterDeleteEventHandler],
    ["EntryAfterPublishEventHandler", EntryAfterPublishEventHandler],
    ["EntryAfterUnpublishEventHandler", EntryAfterUnpublishEventHandler],
    ["EntryAfterRepublishEventHandler", EntryAfterRepublishEventHandler],
    ["EntryAfterMoveEventHandler", EntryAfterMoveEventHandler],
    ["EntryAfterDeleteEventHandler", EntryAfterDeleteEventHandler],
    ["EntryAfterRestoreFromBinEventHandler", EntryAfterRestoreFromBinEventHandler],
    ["EntryAfterDeleteMultipleEventHandler", EntryAfterDeleteMultipleEventHandler],
    [
        "EntryAfterUpdateRevisionDescriptionEventHandler",
        EntryAfterUpdateRevisionDescriptionEventHandler
    ]
] as const;

describe("guard 3 — every handler constructs against the bare minimum", () => {
    it.each(EVENT_HANDLERS.map(([name]) => name))(
        "%s resolves without background tasks registered",
        name => {
            const container = minimalContainer();
            const abstraction = EVENT_HANDLERS.find(([n]) => n === name)![1];

            const handlers = container.resolveAll(abstraction as never);

            expect(handlers.length).toBeGreaterThan(0);
            for (const handler of handlers) {
                expect(typeof (handler as { handle: unknown }).handle).toBe("function");
            }
        }
    );

    it("resolves two handlers for the delete event, recording and cleanup", () => {
        // Recording and cleanup are deliberately separate handlers on the same event so that
        // neither can prevent the other from running.
        const container = minimalContainer();

        expect(container.resolveAll(EntryAfterDeleteEventHandler).length).toBe(2);
    });

    it.each([
        ["EntryActivityRecorder", EntryActivityRecorder],
        ["ActivitySourceResolver", ActivitySourceResolver],
        ["ActivityLogStorage", ActivityLogStorage],
        ["ActivityLogModelProvider", ActivityLogModelProvider]
    ])("%s resolves without background tasks registered", (_name, abstraction) => {
        const container = minimalContainer();

        expect(() => container.resolve(abstraction as never)).not.toThrow();
    });

    it("resolves the purge task definition", () => {
        const container = minimalContainer();

        expect(() => container.resolveAll(TaskDefinition)).not.toThrow();
    });

    it("registers nothing at all when not entitled", () => {
        // The gate has to hold before any of the above matters.
        const container = new Container();
        ActivityLogAppFeature.register(container, { enabled: false });

        expect(container.resolveAll(EntryAfterUpdateEventHandler)).toEqual([]);
    });
});

describe("guard 4 — no required dependency outside the platform contract", () => {
    const SRC = join(import.meta.dirname, "../../src");

    const sourceFiles = (): string[] => {
        const files: string[] = [];

        const walk = (dir: string): void => {
            for (const name of readdirSync(dir)) {
                const path = join(dir, name);
                if (statSync(path).isDirectory()) {
                    walk(path);
                    continue;
                }
                if (name.endsWith(".ts")) {
                    files.push(path);
                }
            }
        };

        walk(SRC);

        return files;
    };

    /** Every non-optional token in every `dependencies` array, by file. */
    const requiredDependencies = (): { file: string; token: string }[] => {
        const found: { file: string; token: string }[] = [];

        for (const file of sourceFiles()) {
            const source = readFileSync(file, "utf8");

            for (const token of extractRequiredTokens(source)) {
                found.push({ file: file.slice(SRC.length + 1), token });
            }
        }

        return found;
    };

    it("finds dependency declarations, so the guard cannot pass vacuously", () => {
        expect(requiredDependencies().length).toBeGreaterThan(10);
    });

    it("declares every required dependency inside the platform contract", () => {
        const offenders = requiredDependencies().filter(
            ({ token }) => !ALWAYS_PRESENT.has(token) && !SELF_REGISTERED.has(token)
        );

        expect(
            offenders,
            `Required dependencies outside the platform contract:\n` +
                offenders.map(o => `  ${o.file}: ${o.token}`).join("\n") +
                `\n\nAn event handler is constructed before it runs, so a dependency that may be ` +
                `absent in some configuration fails the write rather than being caught by a ` +
                `guard. Declare it as [Token, { optional: true }] and handle its absence, or add ` +
                `it to ALWAYS_PRESENT with a reason if it truly is unconditional.`
        ).toEqual([]);
    });

    it("keeps the two known-absent platform dependencies optional", () => {
        const required = requiredDependencies().map(({ token }) => token);

        expect(required).not.toContain("TaskService");
        expect(required).not.toContain("TaskExecutionContext");
    });
});

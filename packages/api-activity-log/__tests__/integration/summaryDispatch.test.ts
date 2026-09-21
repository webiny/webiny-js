import { beforeEach, describe, expect, it, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import type { ITaskTriggerParams } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/api/features/Capabilities/index.js";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { SummaryModelAvailability } from "~/cms/summary/availability.js";
import type { ActivityRecord } from "~/core/types.js";
import { useTestRequest } from "../support/useTestRequest.js";
import { INTEGRATION_MODEL_ID, IntegrationTestModel } from "./testModel.js";

/**
 * Dispatch, inside a real entry write.
 *
 * Every other test of this path runs against a fake dispatcher or a fake recorder. Necessary, and
 * none of it proves that saving an entry with prose in it produces a record carrying the values and
 * a job asking for them — the seam between the CMS's own write, the recorder's containment and the
 * dispatcher's debounce is exactly the part a fake cannot exercise.
 *
 * The two things it has to establish, because both are properties of the design rather than of any
 * one class: the values reach the record in the same write that creates it, and a second save
 * inside the window joins the first rather than paying for a job of its own.
 */

const triggers: ITaskTriggerParams[] = [];

/** Long enough to count as prose. The threshold is 200 characters on the longer side. */
const prose = (marker: string) => `${marker} `.repeat(60);

const handler = useTestRequest({
    setup: container => {
        container.register(IntegrationTestModel);

        // AI Power-Ups, present and configured. The real `CapabilityAvailability` reads this, so
        // the availability check under test is the production one rather than a stub of it.
        container.registerInstance(ResolveAiCapabilityUseCase, {
            execute: async () =>
                Result.ok({
                    capabilityId: "cms.activityLogSummary",
                    model: "anthropic/claude",
                    connection: { sdkName: "anthropic", apiKey: "k" },
                    roleId: "standard",
                    fellBackToStandard: false,
                    guidance: "",
                    additionalInstructions: ""
                } as never)
        } as unknown as ResolveAiCapabilityUseCase.Interface);

        container.registerInstance(TaskService, {
            trigger: async (params: ITaskTriggerParams) => {
                triggers.push(params);
                return Result.ok({ id: `task-${triggers.length}` } as never);
            }
        } as unknown as TaskService.Interface);
    }
});

interface Harness {
    create(values: Record<string, unknown>): Promise<CmsEntry>;
    update(id: string, values: Record<string, unknown>): Promise<CmsEntry>;
    activity(entryId: string): Promise<ActivityRecord[]>;
}

const unwrap = <T, E>(result: Result<T, E>, what: string): T => {
    if (result.isFail()) {
        throw new Error(`${what} failed: ${String(result.error)}`);
    }
    return result.value;
};

const withCms = <T>(callback: (cms: Harness) => Promise<T>): Promise<T> =>
    handler.withContainer(async container => {
        const model: CmsModel = unwrap(
            await container.resolve(GetModelUseCase).execute(INTEGRATION_MODEL_ID),
            "resolving model"
        );

        // Constructed and warmed before the first write. The real implementation resolves its
        // capability asynchronously from a synchronous constructor, so a test that let the first
        // save race that warm-up would be flaky in the direction of passing less than it claims.
        const availability = container.resolve(SummaryModelAvailability);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(availability.isAvailable()).toBe(true);

        const storage = container.resolve(ActivityLogStorage);

        return callback({
            async create(values) {
                return unwrap(
                    await container.resolve(CreateEntryUseCase).execute(model, { values }),
                    "create"
                );
            },
            async update(id, values) {
                return unwrap(
                    await container.resolve(UpdateEntryUseCase).execute(model, id, { values }),
                    "update"
                );
            },
            async activity(entryId) {
                return unwrap(
                    await storage.list({ target: { type: "cms-entry", id: entryId }, limit: 100 }),
                    "listing activity"
                ).records;
            }
        });
    });

beforeEach(() => {
    triggers.length = 0;
});

describe("a save with prose in it", () => {
    it("lands the values on the record and asks for a job", async () => {
        const record = await withCms(async cms => {
            const created = await cms.create({ title: prose("one"), author: { name: "Ada" } });

            await cms.update(created.id, {
                title: prose("two"),
                author: { name: prose("author") }
            });

            const records = await cms.activity(created.entryId);
            return records.find(r => r.action === "entry.update")!;
        });

        // The values are on the record itself, in the same write that created it — not in the
        // task's payload, which is retained indefinitely and indexed.
        expect(record.summaryState?.values?.map(value => value.path).sort()).toEqual([
            "author.name",
            "title"
        ]);
        expect(record.summaryState?.valuesWrittenOn).toBeTruthy();
        expect(record.summary).toBeUndefined();
    });

    it("hands the job identifiers and no content", async () => {
        const record = await withCms(async cms => {
            const created = await cms.create({ title: prose("one"), author: { name: "Ada" } });

            await cms.update(created.id, {
                title: prose("two"),
                author: { name: prose("author") }
            });

            const records = await cms.activity(created.entryId);
            return records.find(r => r.action === "entry.update")!;
        });

        expect(triggers).toHaveLength(1);
        expect(triggers[0]!.input).toEqual({
            recordId: record.id,
            targetId: record.targetId,
            revision: record.revision
        });
        // Nothing of the entry's text travels with it.
        expect(JSON.stringify(triggers[0]!.input)).not.toContain("two");
    });

    it("carries both the before and the after of each changed path", async () => {
        const values = await withCms(async cms => {
            const created = await cms.create({
                title: prose("before"),
                author: { name: "Ada" }
            });

            await cms.update(created.id, {
                title: prose("after"),
                author: { name: prose("author") }
            });

            const records = await cms.activity(created.entryId);
            return records.find(r => r.action === "entry.update")!.summaryState!.values!;
        });

        const title = values.find(value => value.path === "title")!;

        expect(title.before).toContain("before");
        expect(title.after).toContain("after");
        expect(title.label).toBe("Title");
    });
});

describe("a run of saves", () => {
    it("joins the run instead of dispatching again", async () => {
        const records = await withCms(async cms => {
            const created = await cms.create({ title: prose("one"), author: { name: "Ada" } });

            await cms.update(created.id, {
                title: prose("two"),
                author: { name: prose("author two") }
            });
            await cms.update(created.id, {
                title: prose("three"),
                author: { name: prose("author three") }
            });

            return cms.activity(created.entryId);
        });

        const saves = records.filter(record => record.action === "entry.update");

        // One job for the run, which is the whole of the debounce's value.
        expect(saves).toHaveLength(2);
        expect(triggers).toHaveLength(1);
    });

    it("leaves the joining save carrying a reason and no values of its own", async () => {
        // Values on two records for one job would be values nothing is coming to clear.
        const saves = await withCms(async cms => {
            const created = await cms.create({ title: prose("one"), author: { name: "Ada" } });

            await cms.update(created.id, {
                title: prose("two"),
                author: { name: prose("author two") }
            });
            await cms.update(created.id, {
                title: prose("three"),
                author: { name: prose("author three") }
            });

            const records = await cms.activity(created.entryId);
            return records.filter(record => record.action === "entry.update");
        });

        const [newest] = saves;

        expect(newest!.summaryState?.reason).toBe("covered-by-run");
        expect(newest!.summaryState?.values).toBeUndefined();
    });

    it("grows the first record's bundle to span the whole run", async () => {
        // Both saves have to qualify on their own to reach the debounce at all — the routing rule
        // runs before the lookup. The second one changes a field the first did not, so the bundle
        // has somewhere to grow.
        const first = await withCms(async cms => {
            const created = await cms.create({
                title: prose("one"),
                author: { name: "Ada" },
                sections: [{ heading: "A heading" }]
            });

            await cms.update(created.id, {
                title: prose("two"),
                author: { name: prose("author") },
                sections: [{ heading: "A heading" }]
            });
            await cms.update(created.id, {
                title: prose("three"),
                author: { name: prose("author") },
                sections: [{ heading: prose("section") }]
            });

            const records = await cms.activity(created.entryId);
            const saves = records.filter(record => record.action === "entry.update");
            return saves[saves.length - 1]!;
        });

        const values = first.summaryState!.values!;
        const paths = values.map(value => value.path);

        // Three paths where the run began with two: the second save's heading joined the bundle
        // the first save opened.
        expect(paths).toContain("title");
        expect(paths).toContain("author.name");
        expect(paths.some(path => path.endsWith("heading"))).toBe(true);

        // And `title` spans the whole run rather than only the save that last touched it.
        const title = values.find(value => value.path === "title")!;
        expect(title.before).toContain("one");
        expect(title.after).toContain("three");
    });
});

describe("a save no model would improve on", () => {
    const shortSave = () =>
        withCms(async cms => {
            const created = await cms.create({ title: "Starter", author: { name: "Ada" } });

            await cms.update(created.id, { title: "Essential", author: { name: "Ada" } });

            const records = await cms.activity(created.entryId);
            return records.find(r => r.action === "entry.update")!;
        });

    it("is described from its values, inside the write", async () => {
        // The commonest save there is. It gets the same kind of sentence the model would have
        // produced, arrived at mechanically, and it costs nothing to produce.
        const record = await shortSave();

        expect(record.summary).toBe("Changed Title from Starter to Essential.");
        expect(record.summaryKind).toBe("deterministic");
    });

    it("records why the model was not used, and dispatches nothing", async () => {
        const record = await shortSave();

        expect(record.summaryState?.reason).toBe("too-few-text-fields");
        expect(triggers).toHaveLength(0);
    });

    it("stores no values, because nothing is coming to read them", async () => {
        // The privacy difference between the two paths, asserted through a real write: the model's
        // path has to park the values on the record until its job runs, and this one never does.
        const record = await shortSave();

        expect(record.summaryState?.values).toBeUndefined();
        expect(record.summaryState?.valuesWrittenOn).toBeUndefined();
    });
});

describe("the write is never at risk", () => {
    it("saves the entry and records the activity even when dispatching throws", async () => {
        // The planning-containment defect, guarded end to end. It was introduced by widening the
        // writer's surface to carry the plan, which put the dispatcher's failure inside the
        // recorder's outer `try` — losing the activity record along with the summary.
        const outcome = await handler.withContainer(async container => {
            const model: CmsModel = unwrap(
                await container.resolve(GetModelUseCase).execute(INTEGRATION_MODEL_ID),
                "resolving model"
            );

            const storage = container.resolve(ActivityLogStorage);
            const broken = vi.spyOn(storage, "list").mockImplementation(() => {
                throw new Error("the debounce lookup is down");
            });

            const created = unwrap(
                await container.resolve(CreateEntryUseCase).execute(model, {
                    values: { title: prose("one"), author: { name: "Ada" } }
                }),
                "create"
            );

            const updated = await container.resolve(UpdateEntryUseCase).execute(model, created.id, {
                values: { title: prose("two"), author: { name: prose("author") } }
            });

            broken.mockRestore();

            const records = unwrap(
                await storage.list({
                    target: { type: "cms-entry", id: created.entryId },
                    limit: 100
                }),
                "listing activity"
            ).records;

            return { updated, records };
        });

        // The save went through.
        expect(outcome.updated.isOk()).toBe(true);
        // And so did the record, which is the half that was lost.
        expect(outcome.records.map(record => record.action)).toContain("entry.update");
    });
});

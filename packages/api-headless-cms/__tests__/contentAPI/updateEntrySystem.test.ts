import { describe, expect, it, vi } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntry/GetRevisionById/index.js";
import { EntryAfterUpdateEventHandler } from "~/features/contentEntry/UpdateEntry/index.js";
import {
    EntryAfterUpdateSystemEventHandler,
    UpdateEntrySystemUseCase
} from "~/features/contentEntry/UpdateEntrySystem/index.js";
import type { ICmsEntrySystem } from "~/types/index.js";

interface ITestSystem {
    testFlag?: { value: string } | null;
}

const toSystem = (value: ITestSystem) => value as unknown as Partial<ICmsEntrySystem>;

const noteModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Note",
    modelId: "note",
    fields: [createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" })]
});

describe("UpdateEntrySystemUseCase", () => {
    const { handler, tenant } = useHandler({ plugins: [noteModel] });

    const getContext = () =>
        handler({ path: "/cms/manage/en-US", headers: { "x-tenant": tenant.id } });

    const setup = async () => {
        const context = await getContext();
        const model = (await context.container.resolve(GetModelUseCase).execute("note")).value;
        const created = await context.container
            .resolve(CreateEntryUseCase)
            .execute(model, { values: { title: "Hello" } });
        if (created.isFail()) {
            throw created.error;
        }
        return { context, model, entry: created.value };
    };

    it("sets a system key without touching meta", async () => {
        const { context, model, entry } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const result = await updateSystem.execute(
            model,
            entry.id,
            toSystem({ testFlag: { value: "on" } })
        );

        expect(result.isOk()).toBe(true);
        const stored = await context.container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entry.id);
        expect((stored.value.system as ITestSystem).testFlag).toEqual({ value: "on" });
        expect(stored.value.savedOn).toBe(entry.savedOn);
        expect(stored.value.modifiedOn).toBe(entry.modifiedOn);
        expect(stored.value.values).toEqual(entry.values);
    });

    it("stores null values", async () => {
        const { context, model, entry } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        await updateSystem.execute(model, entry.id, toSystem({ testFlag: { value: "on" } }));
        await updateSystem.execute(model, entry.id, toSystem({ testFlag: null }));

        const stored = await context.container
            .resolve(GetRevisionByIdUseCase)
            .execute(model, entry.id);
        expect((stored.value.system as ITestSystem).testFlag).toBeNull();
    });

    it("publishes its own event and not EntryAfterUpdate", async () => {
        const { context, model, entry } = await setup();
        const afterUpdate = vi.fn();
        const afterUpdateSystem = vi.fn();
        context.container.registerInstance(EntryAfterUpdateEventHandler, { handle: afterUpdate });
        context.container.registerInstance(EntryAfterUpdateSystemEventHandler, {
            handle: afterUpdateSystem
        });
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        await updateSystem.execute(model, entry.id, toSystem({ testFlag: { value: "on" } }));

        // Positive control: proves registerInstance handlers are picked up by EventPublisher.
        expect(afterUpdateSystem).toHaveBeenCalledTimes(1);
        expect(afterUpdate).not.toHaveBeenCalled();
    });

    it("fails for an unknown revision", async () => {
        const { context, model } = await setup();
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const result = await updateSystem.execute(model, "unknown#0001", toSystem({}));

        expect(result.isFail()).toBe(true);
    });
});

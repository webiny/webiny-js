import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result, type Webiny } from "@webiny/sdk";
import { LiveSdk } from "./LiveSdk.js";

const DEFAULT_FIELDS = ["id", "entryId", "createdOn", "modifiedOn", "savedOn", "values.*"];

const createWebiny = () => {
    const cms = {
        getModel: vi.fn(),
        getEntry: vi.fn(),
        listEntries: vi.fn()
    };
    return { cms, webiny: { cms } as unknown as Webiny };
};

describe("LiveSdk", () => {
    let cms: ReturnType<typeof createWebiny>["cms"];
    let sdk: LiveSdk;

    beforeEach(() => {
        const created = createWebiny();
        cms = created.cms;
        sdk = new LiveSdk({ apiHost: "https://api.test", apiKey: "test" }, created.webiny);
    });

    it("lists entries with all fields by default", async () => {
        cms.listEntries.mockResolvedValue(Result.ok({ data: [], meta: {} }));

        await sdk.listEntries({ modelId: "calendar" });

        expect(cms.listEntries).toHaveBeenCalledWith(
            expect.objectContaining({ modelId: "calendar", fields: DEFAULT_FIELDS })
        );
    });

    it("lists entries with the requested fields", async () => {
        const fields = ["entryId", "values.eventDate", "values.classRef.values.className"];
        cms.listEntries.mockResolvedValue(Result.ok({ data: [], meta: {} }));

        await sdk.listEntries({ modelId: "calendar", fields });

        expect(cms.listEntries).toHaveBeenCalledWith(
            expect.objectContaining({ modelId: "calendar", fields })
        );
    });

    it("resolves refs with follow-up requests by default", async () => {
        cms.getModel.mockResolvedValue(
            Result.ok({
                modelId: "event",
                metadata: { refModels: { class: { valuesSelection: "className" } } }
            })
        );
        cms.getEntry.mockImplementation(({ modelId }: { modelId: string }) =>
            Result.ok(
                modelId === "event"
                    ? {
                          id: "e1#0001",
                          entryId: "e1",
                          values: { classRef: { id: "c1#0001", modelId: "class" } }
                      }
                    : { id: "c1#0001", entryId: "c1", values: { className: "Yoga" } }
            )
        );

        await sdk.getModel("event");
        const entry = await sdk.getEntry({ modelId: "event", entryId: "e1" });

        expect(cms.getEntry).toHaveBeenCalledTimes(2);
        expect(cms.getEntry).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ fields: DEFAULT_FIELDS })
        );
        expect(entry?.values.classRef).toMatchObject({ values: { className: "Yoga" } });
    });

    it("skips ref resolution when fields are requested", async () => {
        const fields = [
            "entryId",
            "values.classRef.id",
            "values.classRef.modelId",
            "values.classRef.values.className"
        ];
        cms.getModel.mockResolvedValue(
            Result.ok({
                modelId: "event",
                metadata: { refModels: { class: { valuesSelection: "className" } } }
            })
        );
        cms.getEntry.mockResolvedValue(
            Result.ok({
                entryId: "e1",
                values: {
                    classRef: { id: "c1#0001", modelId: "class", values: { className: "Yoga" } }
                }
            })
        );

        await sdk.getModel("event");
        const entry = await sdk.getEntry({ modelId: "event", entryId: "e1", fields });

        expect(cms.getEntry).toHaveBeenCalledTimes(1);
        expect(cms.getEntry).toHaveBeenCalledWith(expect.objectContaining({ fields }));
        expect(entry?.values.classRef).toEqual({
            id: "c1#0001",
            modelId: "class",
            values: { className: "Yoga" }
        });
    });
});

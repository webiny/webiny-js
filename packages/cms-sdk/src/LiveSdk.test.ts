import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { Result } from "@webiny/sdk";
import type { Webiny } from "@webiny/sdk";
import { LiveSdk } from "./LiveSdk.js";

const DEFAULT_FIELDS = ["id", "entryId", "createdOn", "modifiedOn", "savedOn", "values.*"];

const EVENT_MODEL = {
    modelId: "event",
    metadata: { refModels: { class: { valuesSelection: "className" } } }
};

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
        const listResult = Result.ok({ data: [], meta: {} });
        cms.listEntries.mockResolvedValue(listResult);

        await sdk.listEntries({ modelId: "calendar" });

        const expectedParams = expect.objectContaining({
            modelId: "calendar",
            fields: DEFAULT_FIELDS
        });
        expect(cms.listEntries).toHaveBeenCalledWith(expectedParams);
    });

    it("lists entries with the requested fields", async () => {
        const fields = ["entryId", "values.eventDate", "values.classRef.values.className"];
        const listResult = Result.ok({ data: [], meta: {} });
        cms.listEntries.mockResolvedValue(listResult);

        await sdk.listEntries({ modelId: "calendar", fields });

        const expectedParams = expect.objectContaining({ modelId: "calendar", fields });
        expect(cms.listEntries).toHaveBeenCalledWith(expectedParams);
    });

    it("resolves refs with follow-up requests by default", async () => {
        const modelResult = Result.ok(EVENT_MODEL);
        const eventResult = Result.ok({
            id: "e1#0001",
            entryId: "e1",
            values: { classRef: { id: "c1#0001", modelId: "class" } }
        });
        const classResult = Result.ok({
            id: "c1#0001",
            entryId: "c1",
            values: { className: "Yoga" }
        });
        cms.getModel.mockResolvedValue(modelResult);
        cms.getEntry.mockImplementation(({ modelId }: { modelId: string }) => {
            if (modelId === "event") {
                return eventResult;
            }
            return classResult;
        });

        await sdk.getModel("event");
        const entry = await sdk.getEntry({ modelId: "event", entryId: "e1" });

        const expectedParams = expect.objectContaining({ fields: DEFAULT_FIELDS });
        expect(cms.getEntry).toHaveBeenCalledTimes(2);
        expect(cms.getEntry).toHaveBeenNthCalledWith(1, expectedParams);
        expect(entry?.values.classRef).toMatchObject({ values: { className: "Yoga" } });
    });

    it("skips ref resolution when fields are requested", async () => {
        const fields = [
            "entryId",
            "values.classRef.id",
            "values.classRef.modelId",
            "values.classRef.values.className"
        ];
        const modelResult = Result.ok(EVENT_MODEL);
        const eventResult = Result.ok({
            entryId: "e1",
            values: {
                classRef: { id: "c1#0001", modelId: "class", values: { className: "Yoga" } }
            }
        });
        cms.getModel.mockResolvedValue(modelResult);
        cms.getEntry.mockResolvedValue(eventResult);

        await sdk.getModel("event");
        const entry = await sdk.getEntry({ modelId: "event", entryId: "e1", fields });

        const expectedParams = expect.objectContaining({ fields });
        expect(cms.getEntry).toHaveBeenCalledTimes(1);
        expect(cms.getEntry).toHaveBeenCalledWith(expectedParams);
        expect(entry?.values.classRef).toEqual({
            id: "c1#0001",
            modelId: "class",
            values: { className: "Yoga" }
        });
    });
});

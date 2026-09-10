import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";

const eventModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Event",
    modelId: "event",
    fields: [
        createModelField({
            id: "title",
            fieldId: "title",
            type: "text",
            label: "Title"
        }),
        createModelField({
            id: "eventDate",
            fieldId: "eventDate",
            type: "datetime",
            label: "Event Date",
            settings: { type: "date" }
        }),
        createModelField({
            id: "eventTime",
            fieldId: "eventTime",
            type: "datetime",
            label: "Event Time",
            settings: { type: "time" }
        }),
        createModelField({
            id: "eventDateTime",
            fieldId: "eventDateTime",
            type: "datetime",
            label: "Event DateTime",
            settings: { type: "dateTimeWithTimezone" }
        })
    ]
});

const expectValidationError = (result: any, fieldId: string, pattern: RegExp) => {
    expect(result.isFail()).toBe(true);
    const error = result.error;
    expect(error.message).toBe("Validation failed.");
    expect(Array.isArray(error.data)).toBe(true);
    const fieldError = error.data.find((f: any) => f.fieldId === fieldId);
    expect(fieldError).toBeDefined();
    expect(fieldError.error).toMatch(pattern);
};

describe("datetime format validation at use-case level", () => {
    const { handler, tenant } = useHandler({
        plugins: [eventModel]
    });

    const getContext = () =>
        handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });

    describe("date field (settings.type = 'date')", () => {
        it("should accept YYYY-MM-DD", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const modelResult = await getModel.execute("event");
            const model = modelResult.value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDate: "2026-07-01" }
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.values.eventDate).toBe("2026-07-01");
        });

        it("should reject a full ISO timestamp", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDate: "2026-07-01T12:00:00.000Z" }
            });

            expectValidationError(result, "eventDate", /Invalid date format/);
        });

        it("should reject a time value", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDate: "14:30:00" }
            });

            expectValidationError(result, "eventDate", /Invalid date format/);
        });
    });

    describe("time field (settings.type = 'time')", () => {
        it("should accept HH:mm:ss", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventTime: "14:30:00" }
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.values.eventTime).toBe("14:30:00");
        });

        it("should reject a full ISO timestamp", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventTime: "2026-07-01T12:00:00.000Z" }
            });

            expectValidationError(result, "eventTime", /Invalid time format/);
        });

        it("should reject a date value", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventTime: "2026-07-01" }
            });

            expectValidationError(result, "eventTime", /Invalid time format/);
        });
    });

    describe("dateTimeWithTimezone field", () => {
        it("should accept a full ISO 8601 dateTime", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDateTime: "2026-07-01T12:00:00.000+00:00" }
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.values.eventDateTime).toBeDefined();
        });

        it("should reject a plain date", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDateTime: "2026-07-01" }
            });

            expectValidationError(result, "eventDateTime", /Invalid dateTime format/);
        });

        it("should reject a time-only value", async () => {
            const context = await getContext();
            const getModel = context.container.resolve(GetModelUseCase);
            const createEntry = context.container.resolve(CreateEntryUseCase);
            const model = (await getModel.execute("event")).value;

            const result = await createEntry.execute(model, {
                values: { title: "Test", eventDateTime: "14:30:00" }
            });

            expectValidationError(result, "eventDateTime", /Invalid dateTime format/);
        });
    });
});

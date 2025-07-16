import {
    cancelScheduleSchema,
    createScheduleSchema,
    getScheduleSchema,
    listScheduleSchema,
    updateScheduleSchema
} from "~/graphql/schema.js";

describe("graphql/schema", () => {
    it("getScheduleSchema: accepts valid input and returns expected data", async () => {
        const input = { modelId: "model", id: "123" };
        const result = await getScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(input);
        }
    });
    it("getScheduleSchema: rejects missing fields", async () => {
        const result1 = await getScheduleSchema.safeParseAsync({ modelId: "model" });
        const result2 = await getScheduleSchema.safeParseAsync({ id: "123" });
        expect(result1.success).toBe(false);
        expect(result2.success).toBe(false);
    });

    it("listScheduleSchema: accepts valid input and returns expected data", async () => {
        const input = {
            modelId: "model",
            where: { targetId: "t1" },
            sort: ["title_ASC"],
            limit: 10,
            after: "cursor"
        };
        const result = await listScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(input);
        }
    });
    it("listScheduleSchema: rejects missing modelId or where", async () => {
        const result1 = await listScheduleSchema.safeParseAsync({});
        const result2 = await listScheduleSchema.safeParseAsync({ modelId: "model" });
        expect(result1.success).toBe(false);
        expect(result2.success).toBe(false);
    });
    it("listScheduleSchema: rejects invalid sort values", async () => {
        const result = await listScheduleSchema.safeParseAsync({
            modelId: "model",
            where: {},
            sort: ["badformat"]
        });
        expect(result.success).toBe(false);
    });
    it("listScheduleSchema: accepts valid sort values and returns expected data", async () => {
        const input = {
            modelId: "model",
            where: {},
            sort: ["title_ASC", "createdOn_DESC"]
        };
        const result = await listScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({ ...input });
        }
    });

    it("createScheduleSchema: accepts immediate input and returns expected data", async () => {
        const input = {
            modelId: "model",
            id: "123",
            input: { immediately: true, type: "publish" }
        };
        const result = await createScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(input);
        }
    });
    it("createScheduleSchema: accepts dateOn input and returns expected data", async () => {
        const date = new Date();
        const input = {
            modelId: "model",
            id: "123",
            input: { dateOn: date, type: "unpublish" }
        };
        const result = await createScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({
                ...input,
                input: {
                    ...input.input,
                    // @ts-expect-error
                    dateOn: result.data.input.dateOn
                }
            });
            // @ts-expect-error
            expect(result.data.input.dateOn instanceof Date).toBe(true);
        }
    });
    it("createScheduleSchema: rejects missing input fields", async () => {
        const result = await createScheduleSchema.safeParseAsync({
            modelId: "model",
            id: "123",
            input: { type: "publish" }
        });
        expect(result.success).toBe(false);
    });

    it("updateScheduleSchema: accepts immediate input and returns expected data", async () => {
        const input = {
            modelId: "model",
            id: "123",
            input: { immediately: true, type: "publish" }
        };
        const result = await updateScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(input);
        }
    });
    it("updateScheduleSchema: accepts dateOn input and returns expected data", async () => {
        const date = new Date();
        const input = {
            modelId: "model",
            id: "123",
            input: { dateOn: date, type: "unpublish" }
        };
        const result = await updateScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({
                ...input,
                input: {
                    ...input.input,
                    // @ts-expect-error
                    dateOn: result.data.input.dateOn
                }
            });
            // @ts-expect-error
            expect(result.data.input.dateOn instanceof Date).toBe(true);
        }
    });
    it("updateScheduleSchema: rejects missing input fields", async () => {
        const result = await updateScheduleSchema.safeParseAsync({
            modelId: "model",
            id: "123",
            input: { type: "publish" }
        });
        expect(result.success).toBe(false);
    });

    it("cancelScheduleSchema: accepts valid input and returns expected data", async () => {
        const input = { modelId: "model", id: "123" };
        const result = await cancelScheduleSchema.safeParseAsync(input);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual(input);
        }
    });
    it("cancelScheduleSchema: rejects missing fields", async () => {
        const result1 = await cancelScheduleSchema.safeParseAsync({ modelId: "model" });
        const result2 = await cancelScheduleSchema.safeParseAsync({ id: "123" });
        expect(result1.success).toBe(false);
        expect(result2.success).toBe(false);
    });
});

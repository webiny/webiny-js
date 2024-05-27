import { calculateSeconds } from "~/tasks/MockDataManager/calculateSeconds";

describe("calculate seconds to wait for task based on amount of records", () => {
    it("should properly calculate the amount of seconds - 5", async () => {
        const values = calculateSeconds(5);

        expect(values).toBe(15);
    });

    it("should properly calculate the amount of seconds - 10", async () => {
        const values = calculateSeconds(10);

        expect(values).toBe(15);
    });

    it("should properly calculate the amount of seconds - 14", async () => {
        const values = calculateSeconds(14);

        expect(values).toBe(15);
    });

    it("should properly calculate the amount of seconds - 16", async () => {
        const values = calculateSeconds(16);

        expect(values).toBe(15);
    });

    it("should properly calculate the amount of seconds - 50", async () => {
        const values = calculateSeconds(50);

        expect(values).toBe(15);
    });

    it("should properly calculate the amount of seconds - 100", async () => {
        const values = calculateSeconds(100);

        expect(values).toBe(25);
    });

    it("should properly calculate the amount of seconds - 200", async () => {
        const values = calculateSeconds(200);

        expect(values).toBe(50);
    });

    it("should properly calculate the amount of seconds - 300", async () => {
        const values = calculateSeconds(300);

        expect(values).toBe(75);
    });

    it("should properly calculate the amount of seconds - 400", async () => {
        const values = calculateSeconds(400);

        expect(values).toBe(90);
    });

    it("should properly calculate the amount of seconds - 500", async () => {
        const values = calculateSeconds(500);

        expect(values).toBe(90);
    });
});

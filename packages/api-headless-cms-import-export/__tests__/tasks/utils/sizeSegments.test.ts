import { createSizeSegments } from "~/tasks/utils/helpers/sizeSegments";

describe("file segments", () => {
    it("should create file segments - 10MB / 1MB", async () => {
        const segments = createSizeSegments(10000000, "1MB");

        expect(segments).toHaveLength(10);
    });

    it("should create file segments - 100MB / 1MB", async () => {
        const segments = createSizeSegments(104857600, "1MB");

        expect(segments).toHaveLength(100);
    });

    it("should create file segments - 1GB / 1MB", async () => {
        const segments = createSizeSegments(1048576000, "1MB");

        expect(segments).toHaveLength(1000);
    });

    it("should create file segments - 10GB / 1MB", async () => {
        const segments = createSizeSegments(10485760000, "1MB");

        expect(segments).toHaveLength(10000);
    });

    it("should create file segments - 100GB / 1MB", async () => {
        const segments = createSizeSegments(104857600000, "1MB");

        expect(segments).toHaveLength(100000);
    });

    it("should create file segments - 10MB / 5MB", async () => {
        const segments = createSizeSegments(10000000, "5MB");

        expect(segments).toHaveLength(2);
    });

    it("should create file segments - 100MB / 5MB", async () => {
        const segments = createSizeSegments(104857600, "5MB");

        expect(segments).toHaveLength(20);
    });

    it("should create file segments - 1GB / 5MB", async () => {
        const segments = createSizeSegments(1048576000, "5MB");

        expect(segments).toHaveLength(200);
    });

    it("should create file segments - 10GB / 5MB", async () => {
        const segments = createSizeSegments(10485760000, "5MB");

        expect(segments).toHaveLength(2000);
    });

    it("should create file segments - 100GB / 5MB", async () => {
        const segments = createSizeSegments(104857600000, "5MB");

        expect(segments).toHaveLength(20000);
    });
});

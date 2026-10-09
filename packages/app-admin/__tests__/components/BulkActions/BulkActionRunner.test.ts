import { describe, it, expect, vi } from "vitest";
import { BulkActionRunner, type Report } from "~/components/BulkActions/BulkActionRunner";

interface Item {
    id: string;
    label: string;
}

const items: Item[] = [
    { id: "1", label: "First" },
    { id: "2", label: "Second" },
    { id: "3", label: "Third" }
];

describe("BulkActionRunner", () => {
    it("resolves and reports the failure when one item throws", async () => {
        const runner = new BulkActionRunner<Item>({ getItemTitle: item => item.label });
        const onItem = vi.fn(async (item: Item, report: Report) => {
            if (item.id === "2") {
                throw new Error("Boom");
            }
            report.success({ title: item.label, message: "Done." });
        });

        await expect(runner.run(items, false, { onItem })).resolves.toBeUndefined();

        expect(onItem).toHaveBeenCalledTimes(3);
        expect(runner.vm.processing).toBe(false);
        expect(runner.vm.results).toEqual([
            { title: "First", message: "Done.", status: "success" },
            { title: "Second", message: "Boom", status: "failure" },
            { title: "Third", message: "Done.", status: "success" }
        ]);
    });

    it("still rejects when the bulk request fails as a whole", async () => {
        const runner = new BulkActionRunner<Item>();
        const onItem = vi.fn();
        const onBulk = vi.fn(async () => {
            throw new Error("Bulk failed");
        });

        await expect(runner.run(items, true, { onItem, onBulk })).rejects.toThrow("Bulk failed");

        expect(onItem).not.toHaveBeenCalled();
        expect(runner.vm.processing).toBe(false);
    });
});

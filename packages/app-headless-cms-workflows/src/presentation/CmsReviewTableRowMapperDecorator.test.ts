import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { CmsReviewTableRowMapperDecorator } from "~/presentation/CmsReviewTableRowMapperDecorator.js";

interface BaseState {
    selectable: boolean;
}

let base: BaseState;

class FakeRowMapper implements TableRowMapper.Interface {
    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        return { id: entry.id, $selectable: base.selectable, $type: "RECORD", data: entry };
    }
}

const BaseRowMapper = TableRowMapper.createImplementation({
    implementation: FakeRowMapper,
    dependencies: []
});

function createEntry(system: unknown): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status: "draft", version: 1, locked: false, system }
    } as unknown as CmsContentEntry;
}

function createWorkflow(reviewState: string) {
    return {
        workflowId: "wf-1",
        reviewState,
        stepId: "step-1",
        stepName: "Legal review",
        stepState: "inReview"
    };
}

let mapper: TableRowMapper.Interface;

describe("CmsReviewTableRowMapperDecorator", () => {
    beforeEach(() => {
        base = { selectable: true };
        const container = new Container();
        container.register(BaseRowMapper);
        container.registerDecorator(CmsReviewTableRowMapperDecorator);
        mapper = container.resolve(TableRowMapper);
    });

    it("keeps an approved review selectable", () => {
        const row = mapper.fromEntry(
            createEntry({ workflow: createWorkflow(ReviewState.Approved) })
        );

        expect(row.$selectable).toBe(true);
    });

    it.each([
        ["in progress", ReviewState.InProgress],
        ["rejected", ReviewState.Rejected],
        ["cancelled", ReviewState.Cancelled]
    ])("makes a row with a %s review unselectable", (_name, reviewState) => {
        const row = mapper.fromEntry(createEntry({ workflow: createWorkflow(reviewState) }));

        expect(row.$selectable).toBe(false);
    });

    it.each([
        ["no system", undefined],
        ["a null system", null],
        ["a system without a workflow", {}],
        ["a null workflow", { workflow: null }]
    ])("keeps a row with %s selectable", (_name, system) => {
        const row = mapper.fromEntry(createEntry(system));

        expect(row.$selectable).toBe(true);
    });

    it("never makes selectable what the base mapper made unselectable", () => {
        base.selectable = false;

        const row = mapper.fromEntry(
            createEntry({ workflow: createWorkflow(ReviewState.Approved) })
        );

        expect(row.$selectable).toBe(false);
    });

    it("keeps the rest of the row", () => {
        const entry = createEntry({ workflow: createWorkflow(ReviewState.InProgress) });

        const row = mapper.fromEntry(entry);

        expect(row.id).toBe("entry-1#0001");
        expect(row.$type).toBe("RECORD");
        expect(row.data).toBe(entry);
    });
});

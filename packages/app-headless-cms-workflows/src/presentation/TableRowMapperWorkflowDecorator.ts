import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";
import type { ICmsEntrySystemWithWorkflow } from "~/types.js";

class TableRowMapperWithWorkflows implements TableRowMapper.Interface {
    constructor(private decoratee: TableRowMapper.Interface) {}

    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        const row = this.decoratee.fromEntry(entry);

        const meta = entry.meta as Record<string, unknown>;
        const system = meta.system as ICmsEntrySystemWithWorkflow | undefined;
        const workflowState = system?.workflow?.state;
        if (workflowState && workflowState !== WorkflowStateValue.approved) {
            return { ...row, $selectable: false };
        }

        return row;
    }
}

export const TableRowMapperWorkflowDecorator = TableRowMapper.createDecorator({
    decorator: TableRowMapperWithWorkflows,
    dependencies: []
});

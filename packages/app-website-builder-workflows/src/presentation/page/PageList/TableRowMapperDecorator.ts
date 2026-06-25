import { TableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/index.js";
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";
import "~/types.js";

class TableRowMapperWithWorkflows implements TableRowMapper.Interface {
    constructor(private decoratee: TableRowMapper.Interface) {}

    fromPage(page: Page): TableRowMapper.TableRow {
        const row = this.decoratee.fromPage(page);

        const workflowState = page.system?.workflow?.state;
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

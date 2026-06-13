import {
    TableRowMapper,
    type ITableRowMapper,
    type TableRow
} from "@webiny/app-website-builder/presentation/pages/PageList/index.js";
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { WorkflowStateValue } from "@webiny/app-workflows/types.js";
import "~/types.js";

class TableRowMapperWithWorkflows implements ITableRowMapper {
    constructor(private decoratee: ITableRowMapper) {}

    fromPage(page: Page): TableRow {
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

import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { TableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import "~/types.js";

class WbReviewTableRowMapperDecoratorImpl implements TableRowMapper.Interface {
    constructor(private decoratee: TableRowMapper.Interface) {}

    fromPage(page: Page): TableRowMapper.TableRow {
        const row = this.decoratee.fromPage(page);

        const reviewState = page.system?.workflow?.reviewState ?? null;
        if (isReviewSelectable(reviewState)) {
            return row;
        }

        return { ...row, $selectable: false };
    }
}

export const WbReviewTableRowMapperDecorator = TableRowMapper.createDecorator({
    decorator: WbReviewTableRowMapperDecoratorImpl,
    dependencies: []
});

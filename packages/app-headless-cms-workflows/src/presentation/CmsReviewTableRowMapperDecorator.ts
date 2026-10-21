import { TableRowMapper } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

class CmsReviewTableRowMapper implements TableRowMapper.Interface {
    constructor(private readonly decoratee: TableRowMapper.Interface) {}

    fromEntry(entry: CmsContentEntry): TableRowMapper.EntryTableRow {
        const row = this.decoratee.fromEntry(entry);
        const meta: ICmsEntryMetaWithReview = entry.meta;
        const reviewState = meta.system?.workflow?.reviewState ?? null;

        if (isReviewSelectable(reviewState)) {
            return row;
        }

        return { ...row, $selectable: false };
    }
}

export const CmsReviewTableRowMapperDecorator = TableRowMapper.createDecorator({
    decorator: CmsReviewTableRowMapper,
    dependencies: []
});

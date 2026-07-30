import React from "react";
import { createFeature, RegisterFeature } from "webiny/admin";
import { CmsBulkAction } from "webiny/admin/cms/entry/list";

/**
 * "Apply Discount" bulk action on Products — the code-based ("headless") version.
 *
 * A single `CmsBulkAction` class replaces the old hand-written button + websocket handler.
 * The framework generates the toolbar button (from `button()`/`icon`), the confirmation
 * dialog (`confirm()`), the background-task trigger (`buildData()` → `bulkActionProduct`),
 * and the per-entry "Discount applied" toast (`notifications`). No React is written here.
 *
 * `name` PascalCases into the API action (`applyDiscount` → `ApplyDiscount`), matching the
 * API-side `ApplyDiscountBulkAction`. `modelIds` restricts the button to the Products model.
 */
const DISCOUNT_PERCENT = 10;

interface ApplyDiscountData {
    percent: number;
}

// Payload of the `cms.product.discountApplied` websocket message (emitted per processed
// entry by the API-side bulk action).
interface DiscountAppliedData {
    price: number;
    percent: number;
}

class ApplyDiscountBulkActionImpl implements CmsBulkAction.Interface<ApplyDiscountData> {
    readonly name = "applyDiscount";
    readonly modelIds = ["product"];
    readonly icon = "discount";

    button() {
        return {
            text: `Apply -${DISCOUNT_PERCENT}%`,
            tooltip: `Apply ${DISCOUNT_PERCENT}% discount to the selected products`
        };
    }

    confirm(ctx: CmsBulkAction.Ctx<ApplyDiscountData>): CmsBulkAction.Confirm {
        return {
            title: "Apply discount",
            message: `Apply a ${DISCOUNT_PERCENT}% discount to ${ctx.selection.label}? This runs as a background task, so you can keep working while it processes.`,
            loadingLabel: `Processing ${ctx.selection.label}`
        };
    }

    buildData(): ApplyDiscountData {
        return { percent: DISCOUNT_PERCENT };
    }

    readonly notifications = {
        "cms.product.discountApplied": (data: DiscountAppliedData): CmsBulkAction.Notification => ({
            variant: "success",
            title: "Discount applied",
            description: `-${data.percent}% applied — new price ${data.price}.`
        })
    };
}

const ApplyDiscountBulkAction = CmsBulkAction.createImplementation({
    implementation: ApplyDiscountBulkActionImpl,
    dependencies: []
});

const ApplyDiscountFeature = createFeature({
    name: "BulkActions/ApplyDiscount",
    register(container) {
        container.register(ApplyDiscountBulkAction);
    }
});

export default () => {
    return <RegisterFeature feature={ApplyDiscountFeature} />;
};

import React from "react";
import { Text } from "webiny/admin/ui";
import { Widget } from "webiny/admin/ui";
import { ReactComponent as TrendingUpIcon } from "webiny/admin/icons/trending_up.svg";
import { SalesChart } from "./SalesChart.js";
import type { SalesDay } from "./SalesChart.js";
import { ChangeTag } from "./ChangeTag.js";

// Dummy data: 14 days of sales, and the total for the 14 days before them.
const DAYS: SalesDay[] = [
    { label: "Sep 25", amount: 4200 },
    { label: "Sep 26", amount: 3900 },
    { label: "Sep 27", amount: 5100 },
    { label: "Sep 28", amount: 6800 },
    { label: "Sep 29", amount: 6100 },
    { label: "Sep 30", amount: 4700 },
    { label: "Oct 1", amount: 5300 },
    { label: "Oct 2", amount: 5900 },
    { label: "Oct 3", amount: 7200 },
    { label: "Oct 4", amount: 8100 },
    { label: "Oct 5", amount: 7400 },
    { label: "Oct 6", amount: 6600 },
    { label: "Oct 7", amount: 7800 },
    { label: "Oct 8", amount: 8900 }
];
const PREVIOUS_TOTAL = 74300;

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
});

export const SalesWidget = () => {
    const total = DAYS.reduce((sum, day) => sum + day.amount, 0);
    const change = ((total - PREVIOUS_TOTAL) / PREVIOUS_TOTAL) * 100;

    return (
        <Widget
            variant={"light"}
            title={"Sales"}
            description={"Daily revenue over the last 14 days."}
            icon={<Widget.Icon icon={<TrendingUpIcon />} label={"Sales"} />}
            padding={"md"}
        >
            <div className={"rounded-lg bg-neutral-base p-md shadow-sm"}>
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    Revenue
                </Text>
                <div className={"mt-xxs mb-sm flex items-center gap-sm"}>
                    <span className={"text-h2 font-semibold tracking-tight"}>
                        {currency.format(total)}
                    </span>
                    <ChangeTag percent={change} />
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        vs previous 14 days
                    </Text>
                </div>
                <SalesChart days={DAYS} />
            </div>
        </Widget>
    );
};

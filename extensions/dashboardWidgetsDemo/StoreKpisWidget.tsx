import React from "react";
import { Widget } from "webiny/admin/ui";
import { ReactComponent as InsightsIcon } from "webiny/admin/icons/insights.svg";
import { KpiTile } from "./KpiTile.js";
import type { Kpi } from "./KpiTile.js";

// Dummy data: this week's numbers and their daily trend.
const KPIS: Kpi[] = [
    { label: "Orders", value: "1,284", change: 12.6, trend: [62, 70, 66, 81, 79, 93, 101] },
    { label: "Conversion", value: "3.8%", change: 0.9, trend: [3.1, 3.3, 3.2, 3.5, 3.4, 3.6, 3.8] },
    { label: "Avg. order", value: "$68.40", change: 4.2, trend: [61, 63, 62, 66, 64, 67, 68] },
    { label: "New customers", value: "312", change: 21.3, trend: [28, 31, 36, 34, 42, 47, 52] }
];

export const StoreKpisWidget = () => {
    return (
        <Widget
            variant={"light"}
            title={"Store at a glance"}
            description={"This week, compared with last week."}
            icon={<Widget.Icon icon={<InsightsIcon />} label={"Store at a glance"} />}
            padding={"md"}
        >
            <div className={"grid grid-cols-2 gap-sm"}>
                {KPIS.map(kpi => (
                    <KpiTile key={kpi.label} kpi={kpi} />
                ))}
            </div>
        </Widget>
    );
};

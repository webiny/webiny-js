import React from "react";
import { Text } from "webiny/admin/ui";
import { ChangeTag } from "./ChangeTag.js";
import { Sparkline } from "./Sparkline.js";

export interface Kpi {
    label: string;
    value: string;
    change: number;
    trend: number[];
}

export const KpiTile = ({ kpi }: { kpi: Kpi }) => {
    return (
        <div className={"flex flex-col gap-sm rounded-lg bg-neutral-base p-md shadow-sm"}>
            <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                {kpi.label}
            </Text>
            <div className={"flex items-end justify-between gap-sm"}>
                <div className={"flex flex-col items-start gap-xs"}>
                    <span className={"text-h3 font-semibold tracking-tight"}>{kpi.value}</span>
                    <ChangeTag percent={kpi.change} />
                </div>
                <Sparkline values={kpi.trend} width={96} height={44} />
            </div>
        </div>
    );
};

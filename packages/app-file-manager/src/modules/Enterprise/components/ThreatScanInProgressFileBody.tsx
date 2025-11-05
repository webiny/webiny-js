import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as ScanIcon } from "@webiny/icons/policy.svg";

export const ThreatScanInProgressFileBody = () => {
    return (
        <div
            style={{ height: 150 }}
            className={"flex items-center justify-center bg-neutral-muted"}
        >
            <div className={"flex flex-col items-center gap-md"}>
                <Icon
                    icon={<ScanIcon />}
                    label={"Scanning for threats..."}
                    size={"lg"}
                    color={"neutral-light"}
                />
                <Text size={"sm"} className={"text-neutral-strong"}>
                    Scanning for threats...
                </Text>
            </div>
        </div>
    );
};

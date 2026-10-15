import React from "react";
import { Text } from "webiny/admin/ui";
import { Widget } from "webiny/admin/ui";
import { cn } from "webiny/admin/ui";
import { ReactComponent as ShippingIcon } from "webiny/admin/icons/local_shipping.svg";
import { ReactComponent as CartIcon } from "webiny/admin/icons/shopping_cart.svg";
import { ReactComponent as BoltIcon } from "webiny/admin/icons/bolt.svg";
import { ReactComponent as StoreIcon } from "webiny/admin/icons/store.svg";

interface Stage {
    label: string;
    count: number;
    icon: React.ReactElement;
    // Background and icon color of the icon tile.
    tone: [string, string];
}

// Dummy data: where this week's orders are in the fulfilment pipeline.
const STAGES: Stage[] = [
    {
        label: "To pack",
        count: 18,
        icon: <CartIcon />,
        tone: ["--color-warning-100", "--color-warning-700"]
    },
    {
        label: "Express",
        count: 6,
        icon: <BoltIcon />,
        tone: ["--color-primary-100", "--color-primary-600"]
    },
    {
        label: "In transit",
        count: 42,
        icon: <ShippingIcon />,
        tone: ["--color-neutral-200", "--color-neutral-700"]
    },
    {
        label: "Delivered",
        count: 196,
        icon: <StoreIcon />,
        tone: ["--color-success-100", "--color-success-700"]
    }
];

export const FulfilmentWidget = () => {
    return (
        <Widget
            variant={"light"}
            title={"Fulfilment"}
            description={"This week's orders, by stage."}
            icon={<Widget.Icon icon={<ShippingIcon />} label={"Fulfilment"} />}
            padding={"md"}
        >
            <div className={"grid grid-cols-2 gap-sm"}>
                {STAGES.map(stage => (
                    <div
                        key={stage.label}
                        className={
                            "flex items-center gap-sm rounded-lg bg-neutral-base p-sm-extra shadow-sm"
                        }
                    >
                        <span
                            aria-hidden
                            className={cn(
                                "flex size-xl flex-none items-center justify-center rounded-md",
                                "[&>svg]:size-md"
                            )}
                            style={{
                                background: `var(${stage.tone[0]})`,
                                fill: `var(${stage.tone[1]})`
                            }}
                        >
                            {stage.icon}
                        </span>
                        <div>
                            <div className={"text-h4 font-semibold tracking-tight"}>
                                {stage.count}
                            </div>
                            <Text size={"sm"} className={"text-neutral-strong"}>
                                {stage.label}
                            </Text>
                        </div>
                    </div>
                ))}
            </div>
        </Widget>
    );
};

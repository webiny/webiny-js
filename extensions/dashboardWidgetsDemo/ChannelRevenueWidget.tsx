import React from "react";
import { Text } from "webiny/admin/ui";
import { Widget } from "webiny/admin/ui";
import { ReactComponent as StorefrontIcon } from "webiny/admin/icons/storefront.svg";

interface Channel {
    name: string;
    amount: number;
}

// Dummy data: revenue per sales channel over the last 14 days, largest first.
const CHANNELS: Channel[] = [
    { name: "Online store", amount: 41200 },
    { name: "Mobile app", amount: 26800 },
    { name: "Marketplaces", amount: 12900 },
    { name: "Wholesale", amount: 7100 }
];

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
});

export const ChannelRevenueWidget = () => {
    const total = CHANNELS.reduce((sum, channel) => sum + channel.amount, 0);
    const largest = CHANNELS[0].amount;

    return (
        <Widget
            variant={"light"}
            title={"Revenue by channel"}
            description={"Where the last 14 days of sales came from."}
            icon={<Widget.Icon icon={<StorefrontIcon />} label={"Revenue by channel"} />}
            padding={"md"}
        >
            <div className={"flex flex-col gap-md rounded-lg bg-neutral-base p-md shadow-sm"}>
                {CHANNELS.map(channel => {
                    const share = Math.round((channel.amount / total) * 100);
                    const width = `${(channel.amount / largest) * 100}%`;
                    return (
                        <div key={channel.name}>
                            <div className={"mb-xs flex items-baseline justify-between gap-sm"}>
                                <Text size={"md"} className={"font-semibold"}>
                                    {channel.name}
                                </Text>
                                <Text size={"sm"} className={"text-neutral-strong"}>
                                    <span className={"font-semibold text-neutral-primary"}>
                                        {currency.format(channel.amount)}
                                    </span>
                                    {` · ${share}%`}
                                </Text>
                            </div>
                            <div className={"h-[10px] rounded-full bg-neutral-dimmed"}>
                                <div
                                    className={"h-full rounded-full"}
                                    style={{
                                        width,
                                        background:
                                            "linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))"
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </Widget>
    );
};

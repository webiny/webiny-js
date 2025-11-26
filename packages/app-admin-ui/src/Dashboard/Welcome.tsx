import React, { useMemo } from "react";
import { Grid, Heading } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity.js";
import { useAdminConfig } from "@webiny/app-admin";

const Welcome = () => {
    const { identity } = useSecurity();
    const { widgets } = useAdminConfig();

    // Group by column and sort by pin
    const { leftWidgets, rightWidgets } = useMemo(() => {
        const sortByPin = (widgets: typeof widgets) => {
            const pinFirst = widgets.filter(w => w.pin === "first");
            const pinLast = widgets.filter(w => w.pin === "last");
            const regular = widgets.filter(w => !w.pin);
            return [...pinFirst, ...regular, ...pinLast];
        };

        const left = widgets.filter(w => w.column === "left" || !w.column);
        const right = widgets.filter(w => w.column === "right");

        return {
            leftWidgets: sortByPin(left),
            rightWidgets: sortByPin(right)
        };
    }, [widgets]);

    return (
        <div className={"my-xxl"}>
            <div className={"mb-3xl"}>
                <Heading
                    level={3}
                >{`Hi ${identity!.displayName}, what are we doing today?`}</Heading>
            </div>
            <Grid gap={"spacious"} className={"max-w-[1200px]"}>
                <Grid.Column span={6}>
                    <div className={"flex flex-col gap-lg"}>
                        {leftWidgets.map(widget => (
                            <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                        ))}
                    </div>
                </Grid.Column>
                <Grid.Column span={6}>
                    <div className={"flex flex-col gap-lg"}>
                        {rightWidgets.map(widget => (
                            <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                        ))}
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export default Welcome;

import React, { useMemo } from "react";
import { Grid, Heading } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity.js";
import { useAdminConfig } from "@webiny/app-admin";

const Welcome = () => {
    const { identity } = useSecurity();
    const { widgets } = useAdminConfig();

    console.log("123wdgs", widgets);
    // Sort widgets by order and group by column
    const { column1Widgets, column2Widgets } = useMemo(() => {
        const sorted = [...widgets].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return {
            column1Widgets: sorted.filter(w => w.column === 1),
            column2Widgets: sorted.filter(w => w.column === 2)
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
                        {column1Widgets.map(widget => (
                            <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                        ))}
                    </div>
                </Grid.Column>
                <Grid.Column span={6}>
                    <div className={"flex flex-col gap-lg"}>
                        {column2Widgets.map(widget => (
                            <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                        ))}
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export default Welcome;

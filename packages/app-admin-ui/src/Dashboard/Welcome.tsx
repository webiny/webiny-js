import React from "react";
import { Grid, Heading } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity.js";
import { useAdminConfig } from "@webiny/app-admin";

const Welcome = () => {
    const { identity } = useSecurity();
    const { widgets } = useAdminConfig();

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
                        {widgets
                            .filter(w => w.column === "left")
                            .map(widget => (
                                <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                            ))}
                    </div>
                </Grid.Column>
                <Grid.Column span={6}>
                    <div className={"flex flex-col gap-lg"}>
                        {widgets
                            .filter(w => w.column === "right")
                            .map(widget => (
                                <React.Fragment key={widget.name}>{widget.element}</React.Fragment>
                            ))}
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export default Welcome;

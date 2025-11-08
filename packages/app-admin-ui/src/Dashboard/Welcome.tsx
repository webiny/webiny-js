import React from "react";
import { Grid, Heading } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity.js";
import { plugins } from "@webiny/plugins";
import type { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-plugin-admin-welcome-screen/types.js";
import {
    ApplicationWidget,
    AssistanceWidget,
    CommunityWidget,
    MissingPermissionsWidget
} from "./components/index.js";
import { WorkflowStatesOwnWidget, WorkflowStatesRequestedWidget } from "@webiny/app-workflows";
import { useApolloClient } from "@apollo/react-hooks";

const Welcome = () => {
    const { identity, getPermission } = useSecurity();

    const client = useApolloClient();

    if (!identity) {
        return null;
    }

    const widgets = plugins
        .byType<AdminWelcomeScreenWidgetPlugin>("admin-welcome-screen-widget")
        .filter(pl => {
            if (pl.permission) {
                return getPermission(pl.permission);
            }
            return true;
        });

    const canSeeAnyWidget = widgets.length > 0;

    return (
        <div className={"my-xxl"}>
            <div className={"mb-3xl"}>
                <Heading
                    level={3}
                >{`Hi ${identity.displayName}, what are we doing today?`}</Heading>
            </div>
            <Grid gap={"spacious"}>
                <Grid.Column span={5}>
                    {!canSeeAnyWidget && <MissingPermissionsWidget />}
                    <WorkflowStatesRequestedWidget client={client} />
                    <div className={"flex flex-col gap-lg"}>
                        {widgets.map(pl => (
                            <ApplicationWidget
                                key={pl.name}
                                cta={pl.widget.cta}
                                description={pl.widget.description}
                                icon={pl.widget.icon}
                                name={pl.name}
                                title={pl.widget.title}
                            />
                        ))}
                    </div>
                </Grid.Column>
                <Grid.Column span={7}>
                    <div className={"flex flex-col gap-lg"}>
                        <WorkflowStatesOwnWidget client={client} />
                        <AssistanceWidget />
                        <CommunityWidget />
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export default Welcome;

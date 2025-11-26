import React from "react";
import { Grid, Heading } from "@webiny/admin-ui";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity.js";
import {
    AssistanceWidget,
    CommunityWidget,
} from "./components/index.js";
import { WorkflowStatesOwnWidget, WorkflowStatesRequestedWidget } from "@webiny/app-workflows";
import { ContentModelsWidget } from "@webiny/app-headless-cms";
import { useApolloClient } from "@apollo/react-hooks";

const Welcome = () => {
    const { identity } = useSecurity();

    const client = useApolloClient();

    return (
        <div className={"my-xxl"}>
            <div className={"mb-3xl"}>
                <Heading
                    level={3}
                >{`Hi ${identity!.displayName}, what are we doing today?`}</Heading>
            </div>
            <Grid gap={"spacious"} className={"max-w-[1200px]"}>
                <Grid.Column span={5}>
                    <div className={"flex flex-col gap-lg"}>
                        <ContentModelsWidget/>
                        <AssistanceWidget />
                        <CommunityWidget />

                    </div>

                </Grid.Column>
                <Grid.Column span={7}>
                    <div className={"flex flex-col gap-lg"}>
                        <WorkflowStatesOwnWidget client={client} />
                        <WorkflowStatesRequestedWidget client={client} />
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

export default Welcome;

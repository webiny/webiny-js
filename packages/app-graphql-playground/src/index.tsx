import React, { memo } from "react";
import { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { Extensions, AddMenu, AddRoute, Layout } from "@webiny/app-admin";
import { ReactComponent as InfoIcon } from "./assets/graphql.svg";
import Playground from "./plugins/Playground";
import playgroundPlugins from "./plugins";

interface GraphQLPlaygroundProps {
    createApolloClient({ uri: string }): ApolloClient<any>;
}

const GraphQLPlaygroundExtension = ({ createApolloClient }: GraphQLPlaygroundProps) => {
    plugins.register(playgroundPlugins);

    return (
        <Extensions>
            <AddMenu
                id={"apiPlayground"}
                label={"API Playground"}
                path={"/api-playground"}
                icon={<InfoIcon />}
                tags={["footer"]}
            />
            <AddRoute exact path={"/api-playground"}>
                <Layout title={"API Playground"}>
                    <Playground createApolloClient={createApolloClient} />
                </Layout>
            </AddRoute>
        </Extensions>
    );
};

export const GraphQLPlayground = memo(GraphQLPlaygroundExtension);

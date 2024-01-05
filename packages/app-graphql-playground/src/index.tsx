import React, { memo } from "react";
import { ApolloClient } from "apollo-client";
import { plugins } from "@webiny/plugins";
import { Plugins, AddMenu, AddRoute, Layout } from "@webiny/app-admin";
import { ReactComponent as InfoIcon } from "./assets/graphql.svg";
import Playground from "./plugins/Playground";
import playgroundPlugins from "./plugins";

interface CreateApolloClientParams {
    uri: string;
}
interface GraphQLPlaygroundProps {
    createApolloClient(params: CreateApolloClientParams): ApolloClient<any>;
}

const GraphQLPlaygroundExtension = ({ createApolloClient }: GraphQLPlaygroundProps) => {
    plugins.register(playgroundPlugins);

    return (
        <Plugins>
            <AddMenu
                name={"apiPlayground"}
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
        </Plugins>
    );
};

export const GraphQLPlayground = memo(GraphQLPlaygroundExtension);

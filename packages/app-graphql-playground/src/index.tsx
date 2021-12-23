import React from "react";
import { Extensions, AddMenu as Menu } from "@webiny/app-admin";
import { ReactComponent as InfoIcon } from "./assets/graphql.svg";

export const GraphQLPlayground = () => {
    return (
        <Extensions>
            <Menu
                id={"apiPlayground"}
                label={"API Playground"}
                path={"/api-playground"}
                icon={<InfoIcon />}
                tags={["footer"]}
            />
        </Extensions>
    );
};

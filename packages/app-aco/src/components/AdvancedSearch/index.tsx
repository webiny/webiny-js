import React from "react";

import { AdvancedSearch as AdvancedSearchComponent, AdvancedSearchProps } from "./AdvancedSearch";
import { AdvancedSearchConfigs } from "./AdvancedSearchConfigs";
import { AcoWithConfig } from "~/config";

export * from "./GraphQLInputMapper";
export * from "./gateways";
export * from "./useFilterRepository";
export * from "./useInputField";

export const AdvancedSearch = (props: AdvancedSearchProps) => {
    return (
        <>
            <AcoWithConfig>
                <AdvancedSearchComponent {...props} />
            </AcoWithConfig>
            <AdvancedSearchConfigs />
        </>
    );
};

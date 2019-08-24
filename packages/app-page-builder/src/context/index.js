// @flow
import * as React from "react";
import PageBuilderProvider from "./PageBuilderProvider";
import withPageBuilder from "./withPageBuilder";

type WithPageBuilderPropsType = {
    theme: Object,
    isEditor?: boolean,
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>,
            error?: React.ComponentType<any>
        }
    }
};

type PbProviderPropsType = { children: React.Node, ...WithPageBuilderPropsType };

export { withPageBuilder, PageBuilderProvider };
export type { WithPageBuilderPropsType, PbProviderPropsType };

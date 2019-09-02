// @flow
import * as React from "react";
import PageBuilderProvider from "./PageBuilderProvider";
import withPageBuilder from "./withPageBuilder";
import { PageBuilderContext } from "./PageBuilderContext";

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

export { withPageBuilder, PageBuilderContext, PageBuilderProvider };
export type { WithPageBuilderPropsType, PbProviderPropsType };

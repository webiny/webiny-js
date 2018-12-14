// @flow
import * as React from "react";
import CmsProvider from "./CmsProvider";
import withCms from "./withCms";

type WithCmsPropsType = {
    theme: Object,
    isEditor?: boolean,
    defaults?: {
        pages?: {
            notFound?: React.ComponentType<any>,
            error?: React.ComponentType<any>
        }
    }
};

type CmsProviderPropsType = { children: React.Node, ...WithCmsPropsType };

export { withCms, CmsProvider };
export type { WithCmsPropsType, CmsProviderPropsType };

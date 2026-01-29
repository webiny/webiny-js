import React, { useMemo } from "react";
import { useModel } from "~/exports/admin/cms.js";

export interface IsPublishableProps {
    children: React.ReactNode;
}

export const IsModelPublishable = (props: IsPublishableProps) => {
    const { model } = useModel();

    const isPublishable = useMemo(() => !model.tags.includes("$publishing:false"), [model]);

    return isPublishable ? <>{props.children}</> : null;
};

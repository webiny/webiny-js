import type { WorkflowStateValue } from "~/types.js";
import { getTagStateVariant, getStateName } from "./helpers/index.js";
import { Tag } from "@webiny/admin-ui";
import React from "react";

interface ITagStateProps {
    state: WorkflowStateValue;
}

export const TagState = (props: ITagStateProps) => {
    const { state } = props;
    return <Tag variant={getTagStateVariant(state)} content={getStateName(state)} />;
};

import React from "react";
import { type ColumnProps, Grid } from "~/Grid/index.js";

export interface StyledColumnProps extends ColumnProps {
    index: number;
}

export const StyledColumn = (props: StyledColumnProps) => (
    <Grid.Column className="bg-primary text-neutral-light p-2 text-md rounded-sm" {...props}>
        Col {props.index}
        {props.span && (
            <>
                <br />
                <code>span: {props.span}</code>
            </>
        )}
        {props.offset && (
            <>
                <br />
                <code>offset: {props.offset}</code>
            </>
        )}
    </Grid.Column>
);

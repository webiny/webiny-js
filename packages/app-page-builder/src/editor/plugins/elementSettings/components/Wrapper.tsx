import React, { ReactElement } from "react";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";

interface WrapperPropsType {
    label: string;
    containerClassName?: string;
    leftCellSpan?: number;
    rightCellSpan?: number;
    leftCellClassName?: string;
    rightCellClassName?: string;
    children: ReactElement;
}

const Wrapper = ({
    label,
    containerClassName,
    leftCellSpan = 4,
    rightCellSpan = 8,
    leftCellClassName,
    rightCellClassName,
    children
}: WrapperPropsType) => {
    return (
        <Grid className={containerClassName}>
            <Cell span={leftCellSpan} className={leftCellClassName}>
                <Typography use={"body2"}>{label}</Typography>
            </Cell>
            <Cell span={rightCellSpan} className={rightCellClassName}>
                {children}
            </Cell>
        </Grid>
    );
};

export default React.memo(Wrapper);

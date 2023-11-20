import React from "react";

import { Elevation } from "@webiny/ui/Elevation";
import { Cell, Grid } from "@webiny/ui/Grid";

import { OperationSelector } from "./OperationSelector";

import {
    CellInner,
    DetailsContainer,
    FilterDetailsDetails,
    FilterDetailsIcon
} from "../Querybuilder.styled";

export interface DetailsProps {
    name: string;
    description?: string;
}

export const Details = (props: DetailsProps) => {
    return (
        <DetailsContainer>
            <Elevation z={0}>
                <Grid>
                    <Cell span={1} align={"middle"}>
                        <CellInner align={"center"}>
                            <FilterDetailsIcon />
                        </CellInner>
                    </Cell>
                    <Cell span={8} align={"middle"}>
                        <CellInner align={"left"}>
                            <FilterDetailsDetails use={"headline5"} tag={"h3"}>
                                {props.name}
                            </FilterDetailsDetails>
                            {props.description && (
                                <FilterDetailsDetails use={"body1"} tag={"p"}>
                                    {props.description}
                                </FilterDetailsDetails>
                            )}
                        </CellInner>
                    </Cell>
                    <Cell span={3} align={"middle"}>
                        <CellInner align={"right"}>
                            <OperationSelector
                                name={"operation"}
                                label={"Match all filter groups"}
                            />
                        </CellInner>
                    </Cell>
                </Grid>
            </Elevation>
        </DetailsContainer>
    );
};

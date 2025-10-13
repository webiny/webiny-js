import React from "react";
import { Grid, Heading, Text } from "@webiny/admin-ui";
import { OperationSelector } from "./OperationSelector.js";

export interface DetailsProps {
    name: string;
    description?: string;
}

export const Details = (props: DetailsProps) => {
    return (
        <div className="mb-lg">
            <Grid>
                <Grid.Column span={9}>
                    <div className={"flex items-start gap-md"}>
                        <div className={"text-left text-neutral-primary"}>
                            <Heading level={5}>{props.name}</Heading>
                            {props.description && (
                                <Text
                                    as={"div"}
                                    size={"sm"}
                                    className={"mt-xs text-neutral-strong"}
                                >
                                    {props.description}
                                </Text>
                            )}
                        </div>
                    </div>
                </Grid.Column>
                <Grid.Column span={3} align={"middle"}>
                    <div className={"text-right"}>
                        <OperationSelector name={"operation"} label={"Match all filter groups"} />
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

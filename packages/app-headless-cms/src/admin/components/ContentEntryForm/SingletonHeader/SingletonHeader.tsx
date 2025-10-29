import React from "react";
import { Buttons } from "@webiny/app-admin";
import { SaveAction } from "./SaveAction.js";
import { Grid, Heading } from "@webiny/admin-ui";

export interface SingletonHeaderProps {
    title: string;
}

export const SingletonHeader = ({ title }: SingletonHeaderProps) => {
    return (
        <div className={"p-md pl-lg border-b-sm border-neutral-dimmed-darker"}>
            <Grid>
                <Grid.Column span={9}>
                    <Heading level={4} className={"truncate"}>
                        {title}
                    </Heading>
                </Grid.Column>
                <Grid.Column span={3}>
                    <div className="flex items-center justify-end">
                        <Buttons actions={[{ name: "save", element: <SaveAction /> }]} />
                    </div>
                </Grid.Column>
            </Grid>
        </div>
    );
};

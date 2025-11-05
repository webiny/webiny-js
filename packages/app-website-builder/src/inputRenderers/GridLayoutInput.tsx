import React from "react";
import { Grid } from "@webiny/admin-ui";
import type { ElementInputRendererProps } from "~/BaseEditor/index.js";
import { ReactComponent as GridLayout12 } from "./assets/grid-12.svg";
import { ReactComponent as GridLayout66 } from "./assets/grid-6-6.svg";
import { ReactComponent as GridLayout84 } from "./assets/grid-8-4.svg";
import { ReactComponent as GridLayout48 } from "./assets/grid-4-8.svg";
import { ReactComponent as GridLayout444 } from "./assets/grid-4-4-4.svg";
import { ReactComponent as GridLayout633 } from "./assets/grid-6-3-3.svg";
import { ReactComponent as GridLayout336 } from "./assets/grid-3-3-6.svg";
import { ReactComponent as GridLayout3333 } from "./assets/grid-3-3-3-3.svg";
import { ReactComponent as GridLayout222222 } from "./assets/grid-2-2-2-2-2-2.svg";

const presets = [
    {
        layout: "12",
        icon: <GridLayout12 />
    },
    {
        layout: "6-6",
        icon: <GridLayout66 />
    },
    {
        layout: "8-4",
        icon: <GridLayout84 />
    },
    {
        layout: "4-8",
        icon: <GridLayout48 />
    },
    {
        layout: "4-4-4",
        icon: <GridLayout444 />
    },
    {
        layout: "6-3-3",
        icon: <GridLayout633 />
    },
    {
        layout: "3-3-6",
        icon: <GridLayout336 />
    },
    {
        layout: "3-3-3-3",
        icon: <GridLayout3333 />
    },
    {
        layout: "2-2-2-2-2-2",
        icon: <GridLayout222222 />
    }
];

export const GridLayoutInputRenderer = ({ value, onChange }: ElementInputRendererProps) => {
    return (
        <Grid className={"gap-md"}>
            {presets.map(preset => (
                <Grid.Column span={4} key={preset.layout}>
                    <div
                        style={{ filter: value !== preset.layout ? "grayscale(1)" : "none" }}
                        onClick={() => {
                            onChange(({ value }) => {
                                value.set(preset.layout);
                            });
                        }}
                    >
                        {preset.icon}
                    </div>
                </Grid.Column>
            ))}
        </Grid>
    );
};

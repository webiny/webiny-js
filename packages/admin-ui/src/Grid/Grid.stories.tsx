import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Grid, Column } from "./Grid";

const meta: Meta<typeof Grid> = {
    title: "Components/Grid",
    component: Grid,
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
    args: {
        gap: 4,
        content: [
            <Column key="1" content={<>Column 1</>} />,
            <Column key="2" content={<>Column 2</>} />,
            <Column key="3" content={<>Column 3</>} />,
            <Column key="4" content={<>Column 4</>} />,
            <Column key="5" content={<>Column 5</>} />,
            <Column key="6" content={<>Column 6</>} />,
            <Column key="7" content={<>Column 7</>} />,
            <Column key="8" content={<>Column 8</>} />,
            <Column key="9" content={<>Column 9</>} />,
            <Column key="10" content={<>Column 10</>} />,
            <Column key="11" content={<>Column 11</>} />,
            <Column key="12" content={<>Column 12</>} />
        ]
    }
};

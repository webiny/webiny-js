import React from "react";
import type { ComponentProps } from "@webiny/website-builder-react";

type TwoColumnsProps = ComponentProps<{
    title: string;
    leftColumn: React.ReactNode;
    rightColumn: React.ReactNode;
}>;

export const TwoColumns = ({ inputs }: TwoColumnsProps) => {
    return (
        <div>
            <h2>{inputs.title ?? "Default title"}</h2>
            <div className="flex flex-col mb-4">
                <div className="w-full">{inputs.leftColumn}</div>
                <div className="w-full">{inputs.rightColumn}</div>
            </div>
        </div>
    );
};

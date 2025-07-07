import React from "react";
import type { ComponentPropsWithChildren } from "@webiny/website-builder-react";

export const Box = ({ inputs }: ComponentPropsWithChildren) => {
    return <>{inputs.children}</>;
};

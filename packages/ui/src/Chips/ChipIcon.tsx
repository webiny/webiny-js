import * as React from "react";
import { ChipIcon as RmwcChipIcon, ChipIconProps as RmwcChipIconProps } from "@rmwc/chip";
import { chipIconWrapper } from "./styles";

export type ChipIconProps = RmwcChipIconProps;

export const ChipIcon = (props: ChipIconProps) => {
    return <RmwcChipIcon className={chipIconWrapper} {...props} />;
};

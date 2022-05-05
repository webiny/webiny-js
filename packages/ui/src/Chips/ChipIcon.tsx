import React from "react";
import { Chip as RmwcChipIcon, ChipProps as RmwcChipIconProps } from "@rmwc/chip";
import { chipIconWrapper } from "./styles";

export type ChipIconProps = RmwcChipIconProps;

export const ChipIcon: React.FC<ChipIconProps> = props => {
    return <RmwcChipIcon className={chipIconWrapper} {...props} />;
};

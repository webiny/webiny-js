import React from "react";
import { ChipIcon as RmwcChipIcon, ChipIconProps as RmwcChipIconProps } from "@rmwc/chip";
import { chipIconWrapper } from "./styles";

export type ChipIconProps = RmwcChipIconProps;

export const ChipIcon: React.FC<ChipIconProps> = props => {
    return <RmwcChipIcon className={chipIconWrapper} {...props} />;
};

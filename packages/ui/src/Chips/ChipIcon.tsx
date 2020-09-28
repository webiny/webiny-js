import * as React from "react";
import { Chip as RmwcChipIcon, ChipProps as RmwcChipIconProps } from "@rmwc/chip";
import { chipIconWrapper } from "./styles";

export type ChipIconProps = Omit<RmwcChipIconProps, "trailingIcon"> & {
    trailing?: boolean;
    leading?: boolean;
};

export const ChipIcon = (props: ChipIconProps) => {
    return (
        <RmwcChipIcon
            {...props}
            className={chipIconWrapper}
            icon={props.leading && props.icon}
            trailingIcon={props.trailing && props.icon}
        />
    );
};

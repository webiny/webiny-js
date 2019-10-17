// @flow
import * as React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Chip, ChipSet, ChipIcon as RwmcChipIcon } from "@rmwc/chip";

type Props = {
    children: ?React.ChildrenArray<React.Element<typeof Chip>>,

    disabled?: boolean,

    className?: string
};

const disabledChips = css({
    opacity: 0.75,
    pointerEvents: "none"
});

const chipIconWrapper = css({
    ".mdc-chip__icon": {
        svg: {
            width: 18,
            height: 18,
            "&.mdc-chip__icon--trailing": {
                boxSizing: "border-box",
                display: "flex"
            }
        }
    }
});

export const Chips = (props: Props) => {
    const { children, className, disabled, ...rest } = props;

    return (
        <React.Fragment>
            <ChipSet
                {...rest}
                className={classNames(className, chipIconWrapper, {
                    [disabledChips]: disabled
                })}
            >
                {children}
            </ChipSet>
        </React.Fragment>
    );
};

const ChipIcon = (props: Object) => {
    return <RwmcChipIcon className={chipIconWrapper} {...props} />;
};

export { Chip, ChipIcon, ChipSet };

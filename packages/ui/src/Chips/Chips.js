// @flow
import * as React from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Chip, ChipText, ChipSet, ChipIcon as RwmcChipIcon } from "@rmwc/chip";

type Props = {
    children: ?React.ChildrenArray<React.Element<typeof Chip>>,

    disabled?: boolean,

    className?: string
};

const disabledChips = css({
    opacity: 0.75,
    pointerEvents: "none"
});

export const Chips = (props: Props) => {
    const { children, className, disabled, ...rest } = props;

    return (
        <React.Fragment>
            <ChipSet {...rest} className={classNames(className, { [disabledChips]: disabled })}>
                {children}
            </ChipSet>
        </React.Fragment>
    );
};

const chipIconWrapper = css({
    "&.mdc-chip__icon": {
        svg: {
            width: 20,
            height: 20
        },
        "&.mdc-chip__icon--trailing": {
            svg: {
                width: 18,
                height: 18
            }
        }
    }
});

const ChipIcon = (props: Object) => {
    return <RwmcChipIcon className={chipIconWrapper} {...props} />;
};

export { Chip, ChipText, ChipIcon, ChipSet };

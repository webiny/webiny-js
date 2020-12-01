import React, { ReactElement, useCallback, useState } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { COLORS } from "./StyledComponents";
import { Typography } from "@webiny/ui/Typography";

const classes = {
    accordionWrapper: css({
        borderBottom: `1px solid ${COLORS.gray}`
    }),
    accordionTitle: css({
        color: "var(--mdc-theme-text-secondary-on-background)",
        cursor: "pointer",
        padding: "12px 16px",

        display: "flex",
        alignItems: "center",

        "&::before": {
            content: '""',
            width: 0,
            height: 0,
            marginRight: 16,
            // Arrow right.
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: "5px solid currentColor"
        },

        "&.open": {
            color: COLORS.black,
            paddingBottom: 0,

            "&::before": {
                content: '""',
                // Arrow down.
                borderTop: "5px solid currentColor",
                borderBottom: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent"
            }
        }
    }),
    accordionItem: css({
        overflow: "hidden",
        transition: "max-height 0.3s cubic-bezier(1, 0, 1, 0)",
        height: "auto",
        maxHeight: "9999px",

        "&.collapsed": {
            maxHeight: 0,
            transition: "max-height 0.35s cubic-bezier(0, 1, 0, 1)"
        },

        "& .accordion-content": {
            padding: "16px 12px 24px"
        }
    })
};

type AccordionProps = {
    title: string;
    children: ReactElement;
};

const Accordion = ({ title, children }: AccordionProps) => {
    const [isOpen, setOpen] = useState(false);
    const toggleOpen = useCallback(() => setOpen(!isOpen), [isOpen]);

    return (
        <div className={classes.accordionWrapper}>
            <div
                className={classNames(classes.accordionTitle, { open: isOpen })}
                onClick={toggleOpen}
            >
                <Typography use={"subtitle1"}>{title}</Typography>
            </div>
            <div className={classNames(classes.accordionItem, { collapsed: !isOpen })}>
                <div className="accordion-content">{children}</div>
            </div>
        </div>
    );
};

export default React.memo(Accordion);

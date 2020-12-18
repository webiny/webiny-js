import React, { ReactElement, useCallback, useState } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { COLORS } from "./StyledComponents";
import { Typography } from "@webiny/ui/Typography";

const classes = {
    accordionWrapper: css({
        width: "100%",
        borderBottom: `1px solid ${COLORS.gray}`
    }),
    accordionTitle: css({
        position: "relative",
        color: "var(--mdc-theme-text-secondary-on-background)",
        cursor: "pointer",
        padding: "12px 16px",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        "& span": {
            marginLeft: 16
        },

        "&::before": {
            position: "absolute",
            top: 20,
            left: 16,
            content: '""',
            width: 0,
            height: 0,

            // Arrow right.
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: "5px solid currentColor"
        },
        "& .action-container": {
            display: "none"
        },

        "&.open": {
            color: COLORS.black,
            backgroundColor: "hsla(0,0%,97%,1)",

            "&::before": {
                transform: "rotate(90deg)"
            },

            "& .action-container": {
                display: "block"
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
    action?: ReactElement;
    defaultValue?: boolean;
};

const Accordion = ({ title, children, action, defaultValue = false }: AccordionProps) => {
    const [isOpen, setOpen] = useState(defaultValue);
    const toggleOpen = useCallback(() => setOpen(!isOpen), [isOpen]);

    return (
        <div className={classes.accordionWrapper}>
            <div
                className={classNames(classes.accordionTitle, { open: isOpen })}
                onClick={toggleOpen}
            >
                <div>
                    <Typography use={"subtitle1"}>{title}</Typography>
                </div>
                <div className={"action-container"}>{action}</div>
            </div>
            <div className={classNames(classes.accordionItem, { collapsed: !isOpen })}>
                <div className="accordion-content">{children}</div>
            </div>
        </div>
    );
};

export default React.memo(Accordion);

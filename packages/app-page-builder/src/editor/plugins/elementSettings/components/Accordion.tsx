import React, { ReactElement, useCallback, useState } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { COLORS } from "./StyledComponents";
import { Typography } from "@webiny/ui/Typography";

const classes = {
    accordionWrapper: css({
        /**
         * We're using position: "relative" here for "Popping Out of Hidden Overflow" https://css-tricks.com/popping-hidden-overflow/
         * so that, we can use absolute positioned element inside without "overflow: hidden" being a problem
         */
        position: "relative",
        width: "100%",
        borderBottom: `1px solid ${COLORS.gray}`
    }),
    accordionHeader: css({
        position: "relative",
        color: "var(--mdc-theme-text-secondary-on-background)",
        cursor: "pointer",
        padding: "12px 16px",

        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        "& .accordion-header--left": {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: "16px",
            "& .accordion-title": {
                span: {
                    marginLeft: 16
                }
            }
        },
        "& .accordion-header--right": {
            display: "flex",
            "& .action-container": {
                display: "none",
                marginRight: 8
            },
            "& .icon-container": {
                display: "flex",
                alignItems: "center",

                "& span": {
                    display: "flex"
                },
                "& svg": {
                    fill: "currentColor",
                    width: 14,
                    height: 14
                }
            }
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

        "&.open": {
            color: COLORS.black,
            backgroundColor: "hsla(0,0%,97%,1)",

            "&::before": {
                transform: "translateY(3px) rotate(90deg)"
            },

            "& .action-container": {
                display: "block"
            }
        }
    }),
    accordionItem: css({
        overflow: "hidden",
        height: "auto",
        maxHeight: "9999px",
        transition: "max-height 0.3s cubic-bezier(1, 0, 1, 1)",

        "&.collapsed": {
            maxHeight: 0,
            transition: "max-height 0.35s cubic-bezier(0, 1, 0, 1)"
        },

        "&.open": {
            animation: "delay-overflow 10ms 400ms forwards"
        },

        "& .accordion-content": {
            padding: "16px 12px 24px"
        },

        "@keyframes delay-overflow": {
            to: { overflow: "visible" }
        }
    })
};

export interface AccordionProps {
    title: string;
    children: ReactElement;
    action?: ReactElement;
    icon?: ReactElement;
    defaultValue?: boolean;
    className?: string;
}

const Accordion = ({
    title,
    children,
    action,
    icon,
    defaultValue = false,
    className
}: AccordionProps) => {
    const [isOpen, setOpen] = useState(defaultValue);
    const toggleOpen = useCallback(() => setOpen(!isOpen), [isOpen]);

    return (
        <div className={classNames(classes.accordionWrapper, className)}>
            <div
                className={classNames(classes.accordionHeader, { open: isOpen })}
                onClick={toggleOpen}
            >
                <div className="accordion-header--left">
                    <div className={"accordion-title"}>
                        <Typography use={"subtitle1"}>{title}</Typography>
                    </div>
                </div>
                <div className="accordion-header--right">
                    <div className={"action-container"}>{action}</div>
                    <div className={"icon-container"}>{icon}</div>
                </div>
            </div>
            <div
                className={classNames(classes.accordionItem, { collapsed: !isOpen, open: isOpen })}
            >
                <div className="accordion-content">{children}</div>
            </div>
        </div>
    );
};

export default React.memo(Accordion);

import React, { ReactElement, useCallback, useState } from "react";
import { css } from "emotion";
import classNames from "classnames";
import { Typography } from "@webiny/ui/Typography";

const classes = {
    accordionWrapper: css({
        /**
         * We're using position: "relative" here for "Popping Out of Hidden Overflow" https://css-tricks.com/popping-hidden-overflow/
         * so that, we can use absolute positioned element inside without "overflow: hidden" being a problem
         */
        position: "relative",
        width: "100%",
        borderBottom: `1px solid var(--mdc-theme-on-secondary)`
    }),
    accordionHeader: css({
        position: "relative",
        color: "var(--mdc-theme-text-secondary-on-background)",
        cursor: "pointer",
        padding: "0px",
        minHeight: 48, // To have same height as the remove value action button.
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        "& .accordion-header--left": {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            "& .accordion-title": {
                span: {
                    marginLeft: 16
                }
            }
        },
        "& .accordion-header--right": {
            display: "flex",
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
            top: "calc(50% - 5px)",
            left: 0,
            content: '""',
            width: 0,
            height: 0,

            // Arrow right.
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: "5px solid currentColor"
        },

        "&.open": {
            "&::before": {
                transform: "translateY(3px) rotate(90deg)"
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
        ".accordion-content": {
            paddingBottom: 10
        }
    })
};

interface AccordionProps {
    title: string;
    action?: ReactElement | null;
    icon?: ReactElement;
    defaultValue?: boolean;
    children: React.ReactNode;
}

const Accordion = ({ title, children, action, icon, defaultValue = false }: AccordionProps) => {
    const [isOpen, setOpen] = useState(defaultValue);
    const toggleOpen = useCallback(() => setOpen(!isOpen), [isOpen]);

    return (
        <div className={classes.accordionWrapper}>
            <div
                className={classNames(classes.accordionHeader, { open: isOpen })}
                onClick={toggleOpen}
            >
                <div className="accordion-header--left">
                    <div className={"accordion-title"}>
                        <Typography use={"subtitle1"} tag={"span"}>
                            {title}
                        </Typography>
                    </div>
                </div>
                <div className="accordion-header--right">
                    {action && <div className={"action-container"}>{action}</div>}
                    <div className={"icon-container"}>{icon}</div>
                </div>
            </div>
            <div className={classNames(classes.accordionItem, { collapsed: !isOpen })}>
                <div className="accordion-content">{children}</div>
            </div>
        </div>
    );
};
const MemoizedAccordion: React.ComponentType<AccordionProps> = React.memo(Accordion);
export default MemoizedAccordion;

import React from "react";
import { SimpleLink } from "@webiny/app";

/** A path in this admin, such as the page editor link the assistant gives after creating a page. */
const isAdminPath = (href: string): boolean => {
    return href.startsWith("/") && !href.startsWith("//");
};

/*
 * A link to an admin screen opens in place, so the conversation stays on screen and carries on
 * there: a new tab would start the admin, and the assistant, from nothing. Any other link opens in a
 * new tab, as links in the rest of the admin's markdown do.
 */
export const AnswerLink = ({
    href = "",
    children,
    ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (isAdminPath(href)) {
        return (
            <SimpleLink to={href} {...rest}>
                {children}
            </SimpleLink>
        );
    }

    return (
        <a {...rest} href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
};

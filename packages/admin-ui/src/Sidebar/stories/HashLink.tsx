import React, { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
    to: string;
    children?: ReactNode;
    replace?: boolean;
}

/**
 * A Link component that handles hash navigation specially.
 * If the `to` prop starts with '#', it modifies only the hash
 * portion of the current URL instead of navigating.
 */
export const HashLink = ({ to, children, onClick, replace = false, ...props }: LinkProps) => {
    const isHashLink = to?.startsWith("#");

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        if (isHashLink) {
            e.preventDefault();

            // Get current URL and replace/append the hash
            const url = new URL(window.location.href);
            url.hash = to;

            if (replace) {
                // Replace current history entry
                window.history.replaceState(null, "", url.toString());
            } else {
                // Push new history entry
                window.history.pushState(null, "", url.toString());
            }

            // Dispatch a hashchange event so other code can react to it
            window.dispatchEvent(new HashChangeEvent("hashchange"));

            // Scroll to the target element if it exists
            const targetId = to.slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        }

        // Call any additional onClick handler
        onClick?.(e);
    };

    return (
        <a href={to} onClick={handleClick} {...props}>
            {children}
        </a>
    );
};

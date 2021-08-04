import React from "react";

interface Props {
    children: React.ReactNode;
    className?: string;
}

/**
 * The default layout component which you can use on any page.
 * Feel free to customize it or create additional layout components.
 */
export default function Layout(props: Props) {
    return (
        <div className={"layout"}>
            <div className={props.className}>{props.children}</div>
        </div>
    );
}

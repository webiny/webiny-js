import React from "react";

// The default layout component which you can use on any page.
// Feel free to customize it or create additional layout components.
export default function Layout(props) {
    return <div className={"layout"}>{props.children}</div>
}

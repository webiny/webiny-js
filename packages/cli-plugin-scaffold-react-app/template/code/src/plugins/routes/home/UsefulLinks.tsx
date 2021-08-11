import React from "react";
import UsefulLink from "./UsefulLink";

interface Props {
    children: Array<React.ReactComponentElement<typeof UsefulLink>>;
}

// A simple list of useful links. Must contain `UsefulLink` children components.
export default function UsefulLinks(props: Props) {
    return <ul className={"useful-links"}>{props.children}</ul>;
}

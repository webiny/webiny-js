import React from "react";

interface Props {
    title: React.ReactNode;
    children: React.ReactNode;
    url: string;
}

// A simple component used to render useful links, within the `UsefulLinks` component.
export default function UsefulLink({ title, children: description, url }: Props) {
    return (
        <li>
            <a href={"https://www.webiny.com" + url} target="_blank" rel={"noreferrer"}>
                <h1>{title}</h1>
                <div>{description}</div>
            </a>
        </li>
    );
}

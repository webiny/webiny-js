import React from "react";
import transparentBackground from "../images/inner-transparent-bg.svg";
import { Link } from "@webiny/react-router";

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
            <div className={"menu"}>
                <ul>
                    <li>
                        <Link to={"/"}>Home</Link>
                    </li>
                    <li>
                        <Link to={"/simple-graphql-api-example"}>A Simple GraphQL API Example</Link>
                    </li>
                </ul>
                <ul>
                    <li>
                        <a
                            target="_blank"
                            rel={"noreferrer"}
                            href={"https://github.com/webiny/webiny-js"}
                        >
                            GitHub
                        </a>
                    </li>
                    <li>
                        <a target="_blank" rel={"noreferrer"} href={"https://www.webiny.com/slack"}>
                            Community Slack
                        </a>
                    </li>
                </ul>
            </div>
            <div className={props.className}>
                <img alt={"Webiny"} className={"transparent-bg"} src={transparentBackground} />
                <div className={"inner"}>{props.children}</div>
            </div>
        </div>
    );
}

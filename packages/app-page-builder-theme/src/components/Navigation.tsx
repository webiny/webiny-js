import React from "react";
import { Link } from "@webiny/react-router";

function getLink({ url, title }) {
    if (url.startsWith("/")) {
        return <Link to={url}>{title}</Link>;
    }

    return <a href={url}>{title}</a>;
}

const Navigation = ({ data }) => {
    if (!data) {
        return null;
    }

    return (
        <ul>
            {data.items.map((item, index) => {
                if (Array.isArray(item.children)) {
                    return (
                        <li key={item.id + index}>
                            {item.title}
                            <ul>
                                {item.children.map((item, index) => {
                                    return <li key={item.id + index}>{getLink(item)}</li>;
                                })}
                            </ul>
                        </li>
                    );
                }

                return <li key={item.id + index}>{getLink(item)}</li>;
            })}
        </ul>
    );
};

export default Navigation;

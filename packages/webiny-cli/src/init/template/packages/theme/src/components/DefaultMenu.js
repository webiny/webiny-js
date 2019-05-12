// @flow
import React from "react";
import { Link } from "react-router-dom";

function getLink({ url, title }) {
    if (url.startsWith("/")) {
        return <Link to={url}>{title}</Link>;
    }

    return <a href={url}>{title}</a>;
}

const DefaultMenu = ({ data }: Object) => {
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

export default DefaultMenu;

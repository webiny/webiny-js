import React from "react";
import { Link } from "@webiny/react-router";

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
                                    return (
                                        <li key={item.id + index}>
                                            <Link to={item.url}>{item.title}</Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    );
                }

                return (
                    <li key={item.id + index}>
                        <Link to={item.url}>{item.title}</Link>
                    </li>
                );
            })}
        </ul>
    );
};

export default Navigation;

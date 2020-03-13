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
                                    return <Link to={item.url} key={item.id + index}><li>{item.title}</li></Link>;
                                })}
                            </ul>
                        </li>
                    );
                }

                return <Link to={item.url} key={item.id + index}><li>{item.title}</li></Link>;
            })}
        </ul>
    );
};

export default Navigation;

// @flow
import React from "react";

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
                                    return (
                                        <li key={item.id + index}>
                                            <a href={item.url}>{item.title}</a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    );
                }

                return (
                    <li key={item.id + index}>
                        <a href={item.url}>{item.title}</a>
                    </li>
                );
            })}
        </ul>
    );
};

export default DefaultMenu;

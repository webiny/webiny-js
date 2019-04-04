// @flow
import React from "react";

const DefaultMenu = ({ data }: Object) => {
    if (!data) {
        return null;
    }

    return (
        <ul>
            {data.items.map(item => {
                if (Array.isArray(item.children)) {
                    return (
                        <li key={item.id}>
                            {item.title}
                            <ul>
                                {item.children.map(item => {
                                    return (
                                        <li key={item.id}>
                                            <a href={item.url}>{item.title}</a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </li>
                    );
                }

                return (
                    <li key={item.id}>
                        <a href={item.url}>{item.title}</a>
                    </li>
                );
            })}
        </ul>
    );
};

export default DefaultMenu;

// @flow
import React from "react";

const DefaultMenu = ({ data }: Object) => {
    return (
        <ul>
            {data.items.map(item => {
                if (Array.isArray(item.children)) {
                    return (
                        <li key={item.id}>
                            {item.title}
                            <DefaultMenu data={{ items: item.children }} />
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

// @flow
import React from "react";
import { css } from "react-emotion";

const ul = css({
    padding: 20
});

const DefaultMenu = ({ data }: Object) => {
    return (
        <ul className={ul}>
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

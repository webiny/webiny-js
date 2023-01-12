import React from "react";
import { Link } from "@webiny/react-router";
import { PublishedMenuData } from "@webiny/app-website/";
import styled from "@emotion/styled";
import { colors, borderRadius, breakpoints } from "../../../theme";

export const Navigation: React.ComponentType<{ data?: PublishedMenuData }> = ({ data }) => {
    if (!data) {
        return null;
    }
    const { items } = data;

    return (
        <NavigationUl>
            {items?.map((item, index) => {
                if (Array.isArray(item.children)) {
                    return (
                        <li key={item.id + index}>
                            {item.title}
                            <ul>
                                {item.children.map((item, index) => (
                                    <li key={item.id + index}>
                                        <Link to={item.path || item.url}>{item.title}</Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    );
                }

                return (
                    <li key={item.id + index}>
                        <Link to={item.path || item.url}>{item.title}</Link>
                    </li>
                );
            })}
        </NavigationUl>
    );
};

const NavigationUl = styled.ul`
    display: flex;
    justify-content: flex-end;
    box-sizing: border-box;

    li {
        display: inline-block;
        cursor: pointer;
        font-size: 18px;
        font-weight: 400;
        line-height: 1rem;
        margin-left: 25px;
        padding: 10px;
        position: relative;
        transition: background-color 0.2s;

        &:hover {
            background-color: ${colors.color5};
            border-radius: ${borderRadius};
        }
    }

    ${breakpoints.tablet} {
        display: block;
        margin: 75px 0 0 35px;
        text-transform: uppercase;

        li {
            display: block;
            padding: 0;
            margin: 0 0 15px 0;

            a {
                font-size: 20px;
            }
        }
    }
`;

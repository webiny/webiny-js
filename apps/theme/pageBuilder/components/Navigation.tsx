import React from "react";
import { Link } from "@webiny/react-router";
interface NavigationPropsItemChild {
    id: string;
    title: string;
    path: string;
    url: string;
}
interface NavigationPropsItem {
    id: string;
    title: string;
    path: string;
    url: string;
    children: NavigationPropsItemChild[];
}
interface NavigationProps {
    data: {
        items: NavigationPropsItem[];
    };
}
const Navigation: React.FC<NavigationProps> = ({ data }) => {
    const items = data?.items;
    if (!Array.isArray(items)) {
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
        </ul>
    );
};

export default Navigation;

import React from "react";
import { useQuery } from "react-apollo";
import { READ_MENU } from "../graphql";
//import { logoStyle, MenuFooter, MenuHeader, navContent, navHeader, subFooter } from "./Styled";
//import { useNavigation, Menu, Item, Section } from "./MenuNavigationComponents";
import { Link } from "@webiny/react-router";

//might have to be rewworked after migrating to v5 of Webiny
function getLink({url, title}) {
    if (url.startsWith("/")) {
      return <Link to={url}>{title}</Link>;
    }
    return <a href={url}>{title}</a>;
}

function getList({children, title}) {
    return (<ul>{title}
        {children.map((item, index) => {
            if (item.type === "link"){
                return <li key={item.id + index}>{getLink(item)}</li>;
            }
            if (item.type === "folder"){
                return <li key={item.id + index}>{getList(item)}</li>;
            }
            if (item.type === "pages-list"){
                return <li key={item.id + index}>page list</li>;
            }
            if (item.type === "page"){
                return <li key={item.id + index}>page</li>;
            }
        })}
    </ul>)
}

const MenuNavigation = ({menu}) => {
    const variables = {
        id: menu
    }
    const { data, loading: menuLoading, refetch } = useQuery(READ_MENU, {variables});

    if (menuLoading) {
        return <span>Loading...</span>
    } 

    if (!data) {
        return <span>Couln't find Menu!</span>
    }
    const menuData = data?.pageBuilder?.menu?.data;
    let { id, title, slug, description, items, createdOn, loading } = menuData;

    return (
        <>
            <ssr-cache data-class="pb-menu" data-id={slug} />
            {getList({children: items, title})}
        </>
    );
}
export default MenuNavigation;
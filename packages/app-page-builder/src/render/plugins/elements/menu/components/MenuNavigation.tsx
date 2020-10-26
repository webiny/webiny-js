import React from "react";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { Menu as MenuInterface, MenuItem, MenuDivider } from "@webiny/ui/Menu";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { useQuery } from "react-apollo";
import { READ_MENU } from "../graphql";
import { logoStyle, MenuFooter, MenuHeader, navContent, navHeader, subFooter } from "./Styled";
//import { useNavigation, Menu, Item, Section } from "./MenuNavigationComponents";
import { Menu } from "@webiny/app-page-builder/render/components";
import { ReactComponent as MenuIcon } from "@webiny/app-admin/assets/icons/baseline-menu-24px.svg";
import { ReactComponent as DocsIcon } from "@webiny/app-admin/assets/icons/icon-documentation.svg";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";
import { ReactComponent as GithubIcon } from "@webiny/app-admin/assets/icons/github-brands.svg";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import ApiInformationDialog from "@webiny/app-admin/components/ApiInformationDialog";

import { Link } from "@webiny/react-router";

function getLink({url, title}) {
    console.log("get link:::");
    console.log(url);
    console.log(title);
    if (url.startsWith("/")) {
      return <Link to={url}>{title}</Link>;
    }
    return <a href={url}>{title}</a>;
}

function getList({children, title}) {
    console.log("get children::::");
    console.log(children);
    return (<ul>{title}
        {children.map((item, index) => {
            console.log(item.type)
            if (item.type === "link"){
                console.log("link item:::");
                console.log(item.type);
                return <li key={item.id + index}>{getLink(item)}</li>;
            }
            if (item.type === "folder"){
                console.log("folder item:::");
                console.log(item.type);
                return <li key={item.id + index}>{getList(item)}</li>;
            }
            if (item.type === "pages-list"){
                console.log("page list item:::");
                console.log(item.type);
                return <li key={item.id + index}>page list</li>;
            }
            if (item.type === "page"){
                console.log("page item:::");
                console.log(item.type);
                return <li key={item.id + index}>page</li>;
            }
        })}
    </ul>)
}

const MenuNavigation = ({menu}) => {
    console.log("Menu Navigation:::::::::::")
    console.log(menu);
    const variables = {
        id: menu
    }
    const { data, loading: menuLoading, refetch } = useQuery(READ_MENU, {variables});
    //const { hideMenu, menuIsShown, initSections } = useNavigation();
    if (menuLoading) {
        return <span>Loading...</span>
    } 

    if (!data) {
        return <span>Couln't find Menu!</span>
    }
    const menuData = data?.pageBuilder?.menu?.data;
    let { id, title, slug, description, items, createdOn, loading } = menuData;
    console.log(slug);

    console.log("items:::::");
    console.log(items);

    return (
        <>
        <ssr-cache data-class="pb-menu" data-id={slug} />
        {getList({children: items, title})}
        </>
    );
}
export default MenuNavigation;
    /*<Drawer modal open={menuIsShown} onClose={hideMenu}>
        <DrawerHeader className={navHeader}>
            <MenuHeader>
                <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                No Logo
            </MenuHeader>
        </DrawerHeader>
    </Drawer>*/
    /*
                <Menu
                name="menuList"
                label={title}
            >
                <Section label={"Products"}>
                    <Item label={"Products"} path="/shop/products" />
                    <Item label={"Manage stock"} path="/shop/stock" />
                </Section>
                <Section label={"Customers"}>
                    <Item label={"Customers"} path="/shop/customers" />
                    <Item label={"Discounts"} path="/shop/discounts" />
                </Section>
            </Menu>
    */
   /*
                 <Menu name="menuList" label={item.title}>
                            {item?.children && <LoadMenuTree menuList={item?.children}>}
                        </Menu>
*/

/*
      <ul>
        {items.map((item, index) => {
          if (Array.isArray(item.children)) {
            return (
              <li key={item.id + index}>
                {item.title}
                {getList(item)}
              </li>
            );
          }
          //return <li key={item.id + index}>{getLink(item)}</li>;
        })}
      </ul>
*/
/*const LoadMenuTree = ({menuList, menuType}) => {
    console.log("menu list");
    console.log(menuList);
    // {item?.children && <LoadMenuTree menuList={item?.children}/>}
    const MenuBase = (menuType, item) => {
        if (menuType == "dropdown") {
            return (
                <Menu name={`menu-list-${item.id}`} label={item.title}>
                    {item.children}
                </Menu>
            )
        }

    }
    return menuList.map(
        (item) => {
            if (item.type === "folder") {
                return (
                    
                )
            }
        }
    )
}*/
/*
                    <Menu name={`menu-list-${item.id}`} label={item.title}>
                        <Section label={item.title}>
                            {item?.children && <LoadMenuTree menuList={item?.children}/>}
                            <Item label={"Products"} path="/shop/products" />
                            <Section label={"fake section"}>
                                <Item label={"Manage stock"} path="/shop/stock" />
                            </Section>
                        </Section>
                    </Menu>*/

        /*<Drawer modal open={menuIsShown} onClose={hideMenu}>
        <DrawerHeader className={navHeader}>
            <MenuHeader>
                <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                No Logo
            </MenuHeader>
        </DrawerHeader>
    </Drawer>*/
    /*
                <Menu
                name="menuList"
                label={title}
            >
                <Section label={"Products"}>
                    <Item label={"Products"} path="/shop/products" />
                    <Item label={"Manage stock"} path="/shop/stock" />
                </Section>
                <Section label={"Customers"}>
                    <Item label={"Customers"} path="/shop/customers" />
                    <Item label={"Discounts"} path="/shop/discounts" />
                </Section>
            </Menu>
    */
   /*
                 <Menu name="menuList" label={item.title}>
                            {item?.children && <LoadMenuTree menuList={item?.children}>}
                        </Menu>
*/
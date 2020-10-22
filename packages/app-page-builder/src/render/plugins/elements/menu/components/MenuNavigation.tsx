import React from "react";
import { Drawer, DrawerContent, DrawerHeader } from "@webiny/ui/Drawer";
import { List, ListItem, ListItemGraphic } from "@webiny/ui/List";
import { IconButton } from "@webiny/ui/Button";
import { useQuery } from "react-apollo";
import { READ_MENU } from "../graphql";
import { logoStyle, MenuFooter, MenuHeader, navContent, navHeader, subFooter } from "./Styled";
import { useNavigation, Menu, Item, Section } from "./MenuNavigationComponents";
import { ReactComponent as MenuIcon } from "@webiny/app-admin/assets/icons/baseline-menu-24px.svg";
import { ReactComponent as DocsIcon } from "@webiny/app-admin/assets/icons/icon-documentation.svg";
import { ReactComponent as CommunityIcon } from "@webiny/app-admin/assets/icons/icon-community.svg";
import { ReactComponent as GithubIcon } from "@webiny/app-admin/assets/icons/github-brands.svg";
import { ReactComponent as InfoIcon } from "@webiny/app-admin/assets/icons/info.svg";
import ApiInformationDialog from "@webiny/app-admin/components/ApiInformationDialog";

const MenuNavigation = ({menu}) => {
    console.log("Menu Navigation:::::::::::")
    console.log(menu);
    const variables = {
        id: menu
    }
    const { data, loading: menuLoading, refetch } = useQuery(READ_MENU, {variables});
    const { hideMenu, menuIsShown, initSections } = useNavigation();
    if (menuLoading) {
        return <span>Loading...</span>
    } 

    if (!data) {
        return <span>Couln't find Menu!</span>
    }
    const menuData = data?.pageBuilder?.menu?.data;
    let { id, title, slug, description, items, createdOn, loading } = menuData;
    /*<Drawer modal open={menuIsShown} onClose={hideMenu}>
        <DrawerHeader className={navHeader}>
            <MenuHeader>
                <IconButton icon={<MenuIcon />} onClick={hideMenu} />
                No Logo
            </MenuHeader>
        </DrawerHeader>
    </Drawer>*/
    return <span>Menu Navigation Drawer Template</span>
}
export default MenuNavigation;
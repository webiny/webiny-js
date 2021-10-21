import React from "react";
import * as Styled from "./styled";
import MenuItemList from "./MenuItems";
import { useHeader } from "./useMobileHeader";
import { hasMenuItems } from "../Menu";

const NavigationMobile = ({ data }) => {
    const { mobileMenu } = useHeader();
    /**
     * Bail out early if there are no menu items.
     */
    if (!hasMenuItems(data)) {
        return null;
    }
    return (
        <Styled.MobileMenu>
            <MenuItemList items={data.items} sticky={mobileMenu} />
        </Styled.MobileMenu>
    );
};

export default NavigationMobile;

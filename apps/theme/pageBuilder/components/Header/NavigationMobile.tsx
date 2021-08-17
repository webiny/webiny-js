import React from "react";
import * as Styled from "./styled";
import MenuItemList from "./MenuItems";
import { useHeader } from "./useMobileHeader";

const NavigationMobile = ({ data }) => {
    const { mobileMenu } = useHeader();
    /**
     * Bail out early if there is no menu items.
     */
    if (data.items.length === 0) {
        return null;
    }
    return (
        <Styled.MobileMenu>
            <MenuItemList items={data.items} sticky={mobileMenu} />
        </Styled.MobileMenu>
    );
};

export default NavigationMobile;

import React, { useCallback } from "react";
import { get, set } from "dot-prop-immutable";
import { useUi } from "@webiny/app/hooks/useUi";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MenuIcon } from "@material-design-icons/svg/outlined/menu.svg";

const Hamburger = () => {
    const ui = useUi();

    const toggleMenu = useCallback(() => {
        ui.setState(ui => set(ui, "appsMenu.show", !(get(ui, "appsMenu.show") || false)));
    }, [ui]);

    return (
        <IconButton
            icon={<MenuIcon style={{ color: "white" }} />}
            onClick={toggleMenu}
            data-testid={"apps-menu"}
        />
    );
};

export default Hamburger;

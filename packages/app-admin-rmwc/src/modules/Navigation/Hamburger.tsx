import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MenuIcon } from "./icons/hamburger.svg";
import { useNavigation } from "./index";
import { useTags } from "@webiny/app-admin";

const Hamburger = () => {
    const { location } = useTags();
    const { visible, setVisible } = useNavigation();

    if (location === "installer") {
        return null;
    }

    return (
        <IconButton
            icon={<MenuIcon style={{ color: location === "navigation" ? undefined : "white" }} />}
            onClick={() => setVisible(!visible)}
            data-testid={location === "navigation" ? undefined : "apps-menu"}
        />
    );
};

export default Hamburger;

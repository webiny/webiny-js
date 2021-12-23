import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as MenuIcon } from "./icons/hamburger.svg";
import { useNavigation } from "./index";

interface HamburgerProps {
    location: string;
}

const Hamburger = ({ location }: HamburgerProps) => {
    const [value, setValue] = useNavigation();

    return (
        <IconButton
            icon={<MenuIcon style={{ color: location === "drawer" ? undefined : "white" }} />}
            onClick={() => setValue(!value)}
            data-testid={"apps-menu"}
        />
    );
};

export default Hamburger;

import React, { useContext } from "react";
import { IconButton } from "../../../Button";
import { DataListModalOverlayContext } from "./DataListModalOverlayContext";

export type DataListModalOverlayActionProps = {
    icon: React.ReactNode;
};

export const DataListModalOverlayAction = ({ icon }: DataListModalOverlayActionProps) => {
    const { isOpen, setIsOpen } = useContext(DataListModalOverlayContext);

    return <IconButton icon={icon} onClick={() => setIsOpen(!isOpen)} />;
};

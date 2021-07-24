import * as React from "react";

export type MenuProps = {
    name: string;
    label: React.ReactNode;
    icon: React.ReactNode;
    children: React.ReactNode;
    onClick?: (toggleSection: () => void) => void;
};

export default function Menu(props: MenuProps) {
    return props.children;
}

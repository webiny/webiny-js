import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";

export type MenuProps = {
    name: string;
    label: React.ReactNode;
    icon: React.ReactElement;
    children: React.ReactNode;
    onClick?: (toggleSection: () => void) => void;
};

export interface SectionProps {
    parent?: NavigationMenuElement;
    label: React.ReactNode;
    children: React.ReactNode;
    icon?: React.ReactElement;
}

export interface ItemProps {
    parent?: NavigationMenuElement;
    label: React.ReactNode;
    path: string;
    style?: React.CSSProperties;
    onClick?: () => any;
}

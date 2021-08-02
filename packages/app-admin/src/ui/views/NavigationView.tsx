import React, { Fragment } from "react";
import sortBy from "lodash/sortBy";
import { nanoid } from "nanoid";
import { Drawer } from "@webiny/ui/Drawer";
import { UIView } from "~/ui/UIView";
import { plugins } from "@webiny/plugins";
import { GenericElement } from "~/ui/elements/GenericElement";
import { UseSecurity, useSecurity } from "@webiny/app-security";
import { HeaderElement } from "./NavigationView/HeaderElement";
import { ContentElement } from "./NavigationView/ContentElement";
import { FooterElement } from "./NavigationView/FooterElement";
import { useNavigation, UseNavigation } from "~/ui/views/NavigationView/useNavigation";
import { AdminMenuPlugin } from "~/types";
import { NavigationMenuElement, TAGS } from "~/ui/elements/NavigationMenuElement";
import { ItemProps, MenuProps, SectionProps } from "./NavigationView/legacyMenu";
import { ReactComponent as SettingsIcon } from "~/assets/icons/round-settings-24px.svg";

export enum ElementID {
    Header = "navigationHeader",
    Content = "navigationContent",
    Footer = "navigationFooter",
    SettingsMenu = "menu.settings"
}

export class NavigationView extends UIView {
    constructor() {
        super("NavigationView");

        this.useGrid(false);
        this.addHookDefinition("navigation", useNavigation);
        this.addHookDefinition("security", useSecurity);

        const elementConfig = {
            closeMenu: () => this.getHook<UseNavigation>("navigation").hideMenu()
        };

        this.addElement(new HeaderElement(ElementID.Header, elementConfig));
        this.addElement(new ContentElement(ElementID.Content));
        this.addElement(new FooterElement(ElementID.Footer, elementConfig));

        this.addUtilityMenuElement(
            new NavigationMenuElement(ElementID.SettingsMenu, {
                label: "Settings",
                icon: <SettingsIcon />
            })
        );

        // Load legacy plugins and convert them into elements
        this.setupLegacyMenuPlugins();

        this.applyPlugins(NavigationView);
    }

    addAppMenuElement(element: NavigationMenuElement) {
        element.addTag(TAGS.APP);
        return this.getContentElement().addElement(element);
    }

    addUtilityMenuElement(element: NavigationMenuElement) {
        element.addTag(TAGS.UTILS);
        return this.getContentElement().addElement(element);
    }

    addSettingsMenuElement(element: NavigationMenuElement) {
        return this.getSettingsMenuElement().addElement(element);
    }

    getNavigationHook(): UseNavigation {
        return this.getHook("navigation");
    }

    getSecurityHook(): UseSecurity {
        return this.getHook("security");
    }

    getHeaderElement(): HeaderElement {
        return this.getElement(ElementID.Header);
    }

    getContentElement(): ContentElement {
        return this.getElement(ElementID.Content);
    }

    getFooterElement(): FooterElement {
        return this.getElement(ElementID.Footer);
    }

    getSettingsMenuElement(): NavigationMenuElement {
        return this.getElement(ElementID.SettingsMenu);
    }

    render(props?: any): React.ReactNode {
        const { menuIsShown, hideMenu } = this.getNavigationHook();

        return (
            <Drawer modal open={menuIsShown()} onClose={hideMenu}>
                {super.render(props)}
            </Drawer>
        );
    }

    private setupLegacyMenuPlugins() {
        // IMPORTANT! The following piece of code is for BACKWARDS COMPATIBILITY purposes only!
        const menuPlugins = plugins.byType<AdminMenuPlugin>("admin-menu");
        if (!menuPlugins) {
            return;
        }

        const legacyMenu = new GenericElement("legacy-menu");

        const Menu = (props: MenuProps) => {
            const menuItem = this.addAppMenuElement(
                new NavigationMenuElement(`navigation.content.${props.name}`, {
                    label: props.label,
                    icon: props.icon
                })
            );

            return (
                <Fragment>
                    {React.Children.map(props.children, child => {
                        if (!React.isValidElement(child)) {
                            return child;
                        }
                        return React.cloneElement(child, { parent: menuItem });
                    })}
                </Fragment>
            );
        };

        const Section = ({ parent, ...props }: SectionProps) => {
            const sectionMenu = parent.addElement(
                new NavigationMenuElement(nanoid(), {
                    label: props.label
                })
            );

            return (
                <Fragment>
                    {React.Children.map(props.children, child => {
                        if (!React.isValidElement(child)) {
                            return child;
                        }
                        return React.cloneElement(child, { parent: sectionMenu });
                    })}
                </Fragment>
            );
        };

        const Item = ({ parent, ...props }: ItemProps) => {
            parent.addElement(
                new NavigationMenuElement(nanoid(), {
                    label: props.label,
                    path: props.path
                })
            );

            return null;
        };

        sortBy(menuPlugins, [p => p.order || 50, p => p.name]).forEach(plugin => {
            legacyMenu.addElement(
                new GenericElement(plugin.name, () => plugin.render({ Menu, Section, Item }))
            );
        });

        this.addElement(legacyMenu);

        setTimeout(() => {
            legacyMenu.remove();
        }, 100);
    }
}

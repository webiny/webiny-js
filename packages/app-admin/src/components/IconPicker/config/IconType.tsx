import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";
import { createComponentPlugin } from "@webiny/react-composition";
import { IconRenderer, useIcon } from "~/components/IconPicker/IconRenderer";
import { IconPickerTabRenderer } from "../IconPickerTab";

export type IconTypeProps = {
    name: string;
    children: React.ReactNode;
};

interface IconTypeContext {
    type: string;
}

const IconTypeContext = React.createContext<IconTypeContext | undefined>(undefined);

interface IconTypeProviderProps {
    type: string;
    children: React.ReactNode;
}

export const IconTypeProvider = ({ type, children }: IconTypeProviderProps) => {
    return <IconTypeContext.Provider value={{ type }}>{children}</IconTypeContext.Provider>;
};

export function useIconType() {
    const context = React.useContext(IconTypeContext);
    if (!context) {
        throw Error(`Missing <IconTypeProvider> in the component tree!`);
    }
    return context;
}

export interface IconType extends React.FC<IconTypeProps> {
    Icon: typeof Icon;
    Tab: typeof Tab;
}

export const IconType: IconType = ({ name, children }) => {
    const getId = useIdGenerator("iconType");

    return (
        <IconTypeProvider type={name}>
            <Property id={getId(name)} name={"iconTypes"} array={true}>
                <Property id={getId(name, "name")} name={"name"} value={name} />
                {children}
            </Property>
        </IconTypeProvider>
    );
};

export type IconProps = {
    element: React.ReactElement;
};

export const Icon = ({ element }: IconProps) => {
    const { type: configType } = useIconType();

    const IconDecorator = createComponentPlugin(IconRenderer, Original => {
        return function IconRenderer(props) {
            const { icon } = useIcon();

            if (icon.type !== configType) {
                return <Original {...props} />;
            }

            return element;
        };
    });

    return <IconDecorator />;
};

export type TabProps = {
    element: React.ReactElement;
};

export const Tab = ({ element }: TabProps) => {
    const { type: configType } = useIconType();

    const IconPickerTabDecorator = createComponentPlugin(IconPickerTabRenderer, Original => {
        return function IconPickerTabRenderer(props: React.ComponentProps<typeof Original>) {
            const { type } = useIconType();

            if (type !== configType) {
                return <Original {...props} />;
            }

            return element;
        };
    });

    return <IconPickerTabDecorator />;
};

IconType.Icon = Icon;
IconType.Tab = Tab;

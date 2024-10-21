import React from "react";

import { Property, useIdGenerator } from "@webiny/react-properties";

import { IconRenderer, useIcon } from "../IconRenderer";
import { IconPickerTabRenderer } from "../IconPickerTab";

export type IconTypeProps = {
    name: string;
    before?: string;
    after?: string;
    remove?: boolean;
    children?: React.ReactNode;
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

export const IconType: IconType = ({
    name,
    before = undefined,
    after = undefined,
    remove = false,
    children
}) => {
    const getId = useIdGenerator("iconType");

    const placeBefore = before !== undefined ? getId(before) : undefined;
    const placeAfter = after !== undefined ? getId(after) : undefined;

    return (
        <IconTypeProvider type={name}>
            <Property
                id={getId(name)}
                name={"iconTypes"}
                before={placeBefore}
                after={placeAfter}
                remove={remove}
                array={true}
            >
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

    const IconDecorator = IconRenderer.createDecorator(Original => {
        return function IconRenderer() {
            const { icon } = useIcon();

            if (icon.type !== configType) {
                return <Original />;
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

    const IconPickerTabDecorator = IconPickerTabRenderer.createDecorator(Original => {
        return function IconPickerTabRenderer() {
            const { type } = useIconType();

            if (type !== configType) {
                return <Original />;
            }

            return <>{element}</>;
        };
    });

    return <IconPickerTabDecorator />;
};

IconType.Icon = Icon;
IconType.Tab = Tab;

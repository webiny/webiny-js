import React from "react";
import { clsx, type ClassValue } from "clsx";
import { generateId as baseGenerateId } from "@webiny/utils/generateId.js";
import { extendTailwindMerge } from "tailwind-merge";
import { cva, type VariantProps } from "class-variance-authority";
export { makeDecoratable } from "@webiny/react-composition";

const twMerge = extendTailwindMerge({
    override: {
        theme: {
            borderWidth: ["sm", "md", "none"]
        },
        classGroups: {
            "border-color": [
                "border-transparent",
                "border-white",
                "border-accent",
                "border-accent-default",
                "border-accent-dimmed",
                "border-accent-subtle",
                "border-destructive",
                "border-destructive-default",
                "border-destructive-subtle",
                "border-neutral",
                "border-neutral-base",
                "border-neutral-black",
                "border-neutral-dark",
                "border-neutral-dimmed",
                "border-neutral-dimmed-darker",
                "border-neutral-muted",
                "border-neutral-strong",
                "border-neutral-subtle",
                "border-success",
                "border-success-default",
                "border-success-subtle"
            ],
            "border-style": ["border-solid", "border-dashed", "border-dotted"],
            "ring-color": [
                "ring-primary",
                "ring-primary-dimmed",
                "ring-primary-strong",
                "ring-primary-subtle",
                "ring-success",
                "ring-success-dimmed",
                "ring-success-strong",
                "ring-success-subtle"
            ],
            "ring-w": ["ring-sm", "ring-md", "ring-lg"],
            "font-size": [
                "text-h1",
                "text-h2",
                "text-h3",
                "text-h4",
                "text-h5",
                "text-h6",
                "text-sm",
                "text-md",
                "text-lg",
                "text-xl",
                "text-xxl",
                "text-3xl",
                "text-4xl"
            ]
        }
    },
    extend: {
        theme: {
            padding: [
                "lg",
                "md",
                "md-extra",
                "none",
                "sm",
                "sm-extra",
                "sm-plus",
                "xl",
                "xs",
                "xs-plus",
                "xxl",
                "xxs"
            ],
            margin: [
                "lg",
                "md",
                "md-plus",
                "none",
                "sm",
                "sm-extra",
                "sm-plus",
                "xl",
                "xs",
                "xs-plus",
                "xxl",
                "xxs"
            ],
            spacing: [
                "3xl",
                "lg",
                "md",
                "md-plus",
                "none",
                "sm",
                "sm-extra",
                "sm-plus",
                "xl",
                "xs",
                "xs-plus",
                "xxl",
                "xxs",
                "sidebar-collapsed",
                "sidebar-expanded"
            ]
        }
    }
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const generateId = (initialId?: string) => {
    if (initialId) {
        return initialId;
    }
    return "" + baseGenerateId(4);
};

export const withStaticProps = <TComponent extends React.ComponentType<any>, TProps>(
    component: TComponent,
    props: TProps
) => {
    return Object.assign(component, props) as TComponent & TProps;
};

export function createComponentPropsProvider<TProps extends Record<string, any>>() {
    const PropsContext = React.createContext<TProps>({} as TProps);

    type PropsProviderProps = {
        props: TProps;
        children: React.ReactNode;
    };

    const PropsProvider: React.ComponentType<PropsProviderProps> = ({
        props,
        children
    }: PropsProviderProps) => {
        return <PropsContext.Provider value={props}>{children}</PropsContext.Provider>;
    };

    const useProps = () => {
        return React.useContext(PropsContext);
    };

    return [PropsProvider, useProps] as const;
}

export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}

export { cva, type VariantProps };

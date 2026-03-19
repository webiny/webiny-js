import { useEditorConfig } from "~/BaseEditor/index.js";

export interface PageSettingsElementConfig {
    name: string;
    element: JSX.Element;
}

export interface PageSettingsGroupConfig {
    name: string;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    elements: PageSettingsElementConfig[];
}

export interface EditorPageSettings {
    groups: PageSettingsGroupConfig[];
    viewMode: "dialog" | "drawer";
}

interface PageEditorConfig {
    pageSettings: EditorPageSettings;
}

export const usePageEditorConfig = (): PageEditorConfig => {
    const config = useEditorConfig<PageEditorConfig>();

    return {
        ...config,
        pageSettings: {
            groups: config.pageSettings.groups ?? [],
            viewMode: config.pageSettings.viewMode ?? "dialog"
        }
    };
};

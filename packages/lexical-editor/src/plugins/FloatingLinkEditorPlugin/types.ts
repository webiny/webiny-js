export interface LinkFormProps {
    linkData: LinkData;
    onSave: (linkData: LinkData) => void;
    removeLink: () => void;
}

export interface LinkData {
    url: string;
    target: string | null;
    alt: string | null;
}

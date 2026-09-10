export interface ComponentManifest {
    name: string;
    label: string;
    description: string;
}

export interface Component {
    component: unknown;
    manifest: ComponentManifest;
}

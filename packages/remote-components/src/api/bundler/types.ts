export interface ComponentSource {
    name: string;
    source: string;
    css?: string;
}

export interface BundledComponent {
    name: string;
    source: string;
    bundled: string;
    sha256: string;
    css?: string;
    cssSha256?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

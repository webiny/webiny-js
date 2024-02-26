export interface PbPageBlock {
    id: string;
    tenant: string;
    locale: string;
    blockCategory: string;
    content: Record<string, any>;
    preview?: any;
}

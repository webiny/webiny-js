export interface AssetCrop {
    top: number;
    left: number;
    bottom: number;
    right: number;
}

export interface AssetFocalPoint {
    x: number;
    y: number;
}

export interface AssetImage {
    width?: number;
    height?: number;
    crop?: AssetCrop;
    focalPoint?: AssetFocalPoint;
    alt?: string;
    caption?: string;
}

export interface AssetDocument {
    pages?: number;
}

export interface AssetVideo {
    autoplay?: boolean;
    poster?: string;
}

export interface Asset {
    id: string;
    src: string;
    url: string;
    name: string;
    type: string;
    size: number;
    image?: AssetImage;
    document?: AssetDocument;
    video?: AssetVideo;
}

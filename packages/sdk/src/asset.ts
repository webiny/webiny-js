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
    mimeType: string;
    size: number;
    /**
     * Intrinsic image dimensions, the same values as `image.width` and `image.height`.
     * Kept at the root because 6.4 frontends read them there. New code should read `image.*`.
     */
    width?: number;
    height?: number;
    image?: AssetImage;
    document?: AssetDocument;
    video?: AssetVideo;
}

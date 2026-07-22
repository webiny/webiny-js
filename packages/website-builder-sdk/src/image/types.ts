export type { AssetCrop, AssetFocalPoint } from "@webiny/sdk";

export type AspectRatioInput = number | { width: number; height: number };

export interface AspectRatioPreset {
    id: string;
    label: string;
    ratio: number;
}

import type { TransformImageParams, TransformImageResult } from "./transformImage.js";
import type { Framing } from "./imageTypes.js";

export class SharpTransformer {
    private module?: typeof import("./transformImage.js");
    private sharp?: typeof import("sharp").default;

    private async load() {
        if (!this.module) {
            this.module = await import("./transformImage.js");
        }
        return this.module;
    }

    private async getSharp() {
        if (!this.sharp) {
            this.sharp = (await import("sharp")).default;
        }
        return this.sharp;
    }

    async transformBuffer(params: TransformImageParams): Promise<TransformImageResult> {
        const m = await this.load();
        return m.transformImageBuffer(params);
    }

    async extractFramedRegion(buffer: Buffer, framing: Framing): Promise<Buffer> {
        const m = await this.load();
        return m.extractFramedRegion(buffer, framing);
    }

    async cropBuffer(
        buffer: Buffer,
        crop: { top: number; left: number; bottom: number; right: number }
    ): Promise<Buffer> {
        const m = await this.load();
        return m.cropImageBuffer(buffer, crop);
    }

    async optimizePng(buffer: Buffer) {
        const s = await this.getSharp();
        return s(buffer)
            .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
            .png({ compressionLevel: 9, adaptiveFiltering: true, force: true })
            .withMetadata();
    }

    async optimizeJpeg(buffer: Buffer) {
        const s = await this.getSharp();
        return s(buffer)
            .resize({ width: 2560, withoutEnlargement: true, fit: "inside" })
            .withMetadata()
            .toFormat("jpeg", { quality: 90 });
    }
}

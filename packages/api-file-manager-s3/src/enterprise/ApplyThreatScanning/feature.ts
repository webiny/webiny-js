import { createFeature } from "@webiny/feature/api";
import { CreateFileWithThreatScanDecorator } from "./CreateFileWithThreatScanDecorator.js";

export const ApplyThreatScanningFeature = createFeature({
    name: "FileManagerS3/ApplyThreatScanning",
    register(container) {
        container.registerDecorator(CreateFileWithThreatScanDecorator);
    }
});

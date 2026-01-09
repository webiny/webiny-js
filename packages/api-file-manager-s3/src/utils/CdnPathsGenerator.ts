export class CdnPathsGenerator {
    generate(fileId: string): string[] {
        return [`/files/${fileId}/*`, `/private/${fileId}/*`];
    }
}

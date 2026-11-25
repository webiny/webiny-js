import { FolderTypeAccess as Abstraction, FolderTypePermissions } from "./abstractions.js";

class FolderTypeAccessImpl implements Abstraction.Interface {
    constructor(private permissions: FolderTypePermissions.Interface[]) {}

    async canRead(type: string): Promise<boolean> {
        const handler = this.permissions.find(p => p.canHandle(type));
        return handler ? handler.canRead(type) : true;
    }

    async canWrite(type: string): Promise<boolean> {
        const handler = this.permissions.find(p => p.canHandle(type));
        return handler ? handler.canWrite(type) : true;
    }
}

export const FolderTypeAccess = Abstraction.createImplementation({
    implementation: FolderTypeAccessImpl,
    dependencies: [[FolderTypePermissions, { multiple: true }]]
});

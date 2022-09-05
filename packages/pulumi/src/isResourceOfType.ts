import { PulumiAppResource, PulumiAppResourceConstructor } from "~/PulumiAppResource";

export function isResourceOfType<T extends PulumiAppResourceConstructor>(
    resource: PulumiAppResource<PulumiAppResourceConstructor>,
    type: T
): resource is PulumiAppResource<T> {
    return resource.type === type;
}

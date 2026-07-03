import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { usePermission } from "~/admin/hooks/usePermission.js";

interface HasContentEntryPermissionsProps {
    group: Pick<ModelGroupDto, "id" | "contentModels">;
    contentModel?: { modelId: string };
    children: React.JSX.Element;
}

export const HasContentEntryPermissions = ({
    group,
    contentModel,
    children
}: HasContentEntryPermissionsProps) => {
    const { canReadEntries } = usePermission();

    if (contentModel && !canReadEntries({ contentModelGroup: group, contentModel })) {
        return null;
    }

    const hasContentEntryPermission = group.contentModels.some(contentModel =>
        canReadEntries({
            contentModelGroup: group,
            contentModel
        })
    );

    if (group.contentModels.length > 0 && !hasContentEntryPermission) {
        return null;
    }

    return children;
};

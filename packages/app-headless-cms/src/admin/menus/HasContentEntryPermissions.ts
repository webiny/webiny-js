import type { CmsGroup, CmsModel } from "~/types.js";
import { usePermission } from "~/admin/hooks/usePermission.js";

interface HasContentEntryPermissionsProps {
    group: CmsGroup;
    contentModel?: CmsModel;
    children: JSX.Element;
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

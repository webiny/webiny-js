import {usePermission} from "@webiny/app-headless-cms/exports/admin/cms.js";
import {useCallback} from "react";


export const usePermissions = ( )=> {
    const permission = usePermission();
    
    const canPublish = useCallback(() => {
        return permission.canPublish("cms.contentEntry");
    }, [permission.canPublish]);
    
    const canUnpublish = useCallback(() => {
        return permission.canUnpublish("cms.contentEntry");
    }, [permission.canUnpublish]);
    
    return {
        canPublish,
        canUnpublish,
    }
}

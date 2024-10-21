import {
    useCreateFolder,
    useDeleteFolder,
    useGetDescendantFolders,
    useGetFolder,
    useGetFolderLevelPermission,
    useListFolders,
    useUpdateFolder
} from "~/features/folder";

export const useFolders = () => {
    const { createFolder } = useCreateFolder();
    const { deleteFolder } = useDeleteFolder();
    const { listFolders, folders, loading } = useListFolders();
    const { updateFolder } = useUpdateFolder();
    const { getDescendantFolders } = useGetDescendantFolders();
    const { getFolder } = useGetFolder();
    const { getFolderLevelPermission: canManageStructure } =
        useGetFolderLevelPermission("canManageStructure");
    const { getFolderLevelPermission: canManagePermissions } =
        useGetFolderLevelPermission("canManagePermissions");
    const { getFolderLevelPermission: canManageContent } =
        useGetFolderLevelPermission("canManageContent");

    return {
        folders,
        loading,
        listFolders,
        getFolder,
        getDescendantFolders,
        createFolder,
        updateFolder,
        deleteFolder,
        folderLevelPermissions: {
            canManageStructure,
            canManagePermissions,
            canManageContent
        }
    };
};

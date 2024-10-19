import {
    useCreateFolder,
    useDeleteFolder,
    useGetCanManageContent,
    useGetCanManagePermissions,
    useGetCanManageStructure,
    useGetDescendantFolders,
    useGetFolder,
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
    const { canManageStructure } = useGetCanManageStructure();
    const { canManagePermissions } = useGetCanManagePermissions();
    const { canManageContent } = useGetCanManageContent();

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

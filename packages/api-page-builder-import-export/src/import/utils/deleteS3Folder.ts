import { s3Stream } from "~/export/s3Stream";

export async function deleteS3Folder(key: string): Promise<void> {
    // Append trailing slash i.e "/" to key to make sure we only delete a specific folder.
    if (!key.endsWith("/")) {
        key = `${key}/`;
    }

    const response = await s3Stream.listObject(key);
    const keys = (response.Contents || []).map(c => c.Key).filter(Boolean) as string[];
    console.log(`Found ${keys.length} files.`);

    const deleteFilePromises = keys.map(key => s3Stream.deleteObject(key));

    await Promise.all(deleteFilePromises);
    console.log(`Successfully deleted ${deleteFilePromises.length} files.`);
}

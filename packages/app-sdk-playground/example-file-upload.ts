// SDK Playground - Simple File Upload Test
// This creates a mock file and uploads it to demonstrate the flow

async function run() {
    console.log("=== Simple File Upload Test ===\n");

    // ========================================================================
    // Create a simple text file inline (Browser-compatible)
    // ========================================================================

    // Create a simple text content
    const textContent = "Hello from Webiny SDK!\nThis is a test file created inline.";

    // Convert text to Blob (works in browser)
    const fileBlob = new Blob([textContent], { type: "text/plain" });

    // Create a File object from the Blob
    const testFile = new File([fileBlob], "test-document.txt", {
        type: "text/plain",
        lastModified: Date.now()
    });

    console.log("📄 Created test file:");
    console.log(`  Name: ${testFile.name}`);
    console.log(`  Type: ${testFile.type}`);
    console.log(`  Size: ${testFile.size} bytes`);
    console.log("");

    // ========================================================================
    // Upload the file with progress tracking
    // ========================================================================

    console.log("⬆️  Uploading file...");

    const uploadResult = await sdk.fileManager.createFile({
        file: testFile,
        data: {
            name: testFile.name,
            type: testFile.type,
            size: testFile.size,
            tags: ["test", "playground", "inline"],
            location: { folderId: "root" }
        },
        fields: [
            "id",
            "name",
            "src",
            "key",
            "size",
            "type",
            "tags",
            "createdOn",
            "location.folderId"
        ],
        onProgress: progress => {
            console.log(
                `  📊 Progress: ${progress.percentage}% (${progress.sent}/${progress.total} bytes)`
            );
        }
    });

    if (uploadResult.isOk()) {
        console.log("\n✅ Upload successful!");
        console.log("File details:", uploadResult.value);

        // Now list files to see our uploaded file
        console.log("\n📋 Listing files...");
        const listResult = await sdk.fileManager.listFiles({
            limit: 5,
            sort: ["createdOn_DESC"],
            fields: ["id", "name", "size", "type", "createdOn"]
        });

        if (listResult.isOk()) {
            console.log(`Found ${listResult.value.data.length} files:`);
            listResult.value.data.forEach(file => {
                console.log(`  - ${file.name} (${file.size} bytes)`);
            });
        }
    } else {
        console.error("\n❌ Upload failed:", uploadResult.error);
    }

    console.log("\n=== Test completed ===");
}

run();

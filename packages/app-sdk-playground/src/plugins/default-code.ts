// Default code template shown in the SDK Playground.
export const defaultSdkCode = `// SDK Playground - Try out the Webiny SDK
// SDK is available as a global 'sdk' variable

async function run() {
    // List entries from a CMS model
    const result = await sdk.cms.listEntries({
        model: "article"
    });

    // Handle the result
    if (result.isOk()) {
        console.log("Entries:", result.value);
    } else {
        console.error("Error:", result.error);
    }
}

run();
`;

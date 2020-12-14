export const INSTALL = /* GraphQL */ `
    mutation Install($srcPrefix: String) {
        fileManager {
            install(srcPrefix: $srcPrefix) {
                data
            }
        }
    }
`;

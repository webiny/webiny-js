const normalizeInputs = require("./../utils/normalizeInputs");

describe("normalizeInputs function test", () => {
    it("passing empty value should throw error", async () => {
        try {
            normalizeInputs();
        } catch (e) {
            return;
        }

        try {
            normalizeInputs({});
        } catch (e) {
            return;
        }

        throw new Error(`Error should've been thrown.`);
    });

    it(`must throw an error if inputs is missing "region"`, async () => {
        try {
            normalizeInputs({});
        } catch (e) {
            expect(e.message).toBe('Component "region" is missing.');
            return;
        }
        throw new Error(`Error should've been thrown.`);
    });

    it(`must throw an error if inputs is missing "bucket"`, async () => {
        try {
            normalizeInputs({ region: "test-123" });
        } catch (e) {
            expect(e.message).toBe('Component "bucket" is missing.');
            return;
        }
        throw new Error(`Error should've been thrown.`);
    });

    it("passing old inputs structure should return new inputs structure with overrides applied correctly", async () => {
        const inputs = normalizeInputs({
            region: "test-region",
            bucket: "test-bucket",
            memory: 1,
            timeout: 2,
            database: {
                one: 1,
                two: 2,
                three: 3
            },
            uploadMinFileSize: 3,
            uploadMaxFileSize: 4,
            env: {
                one: 1,
                two: 2,
                three: 3
            },
            webpackConfig: {
                four: 4,
                five: 5,
                six: 6
            }
        });

        expect(inputs).toEqual({
            region: "test-region",
            bucket: "test-bucket",
            functions: {
                apolloService: {
                    memory: 1,
                    timeout: 2,
                    database: {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    uploadMinFileSize: 3,
                    uploadMaxFileSize: 4,
                    env: {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    webpackConfig: {
                        four: 4,
                        five: 5,
                        six: 6
                    }
                },
                downloadFile: {
                    memory: 512,
                    timeout: 10,
                    env: {}
                },
                imageTransformer: {
                    memory: 1024,
                    timeout: 10,
                    env: {}
                }
            }
        });
    });

    it("passing new inputs structure should return overrides successfully", async () => {
        const inputs = normalizeInputs({
            name: "test-File",
            region: "test-region",
            bucket: "test-bucket",
            functions: {
                apolloService: {
                    memory: 1,
                    timeout: 2,
                    database: {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    uploadMinFileSize: 3,
                    uploadMaxFileSize: 4,
                    env: {
                        one: 1,
                        two: 2,
                        three: 3
                    }
                },
                downloadFile: {
                    memory: 5,
                    timeout: 6
                },
                imageTransformer: {
                    memory: 7,
                    timeout: 8
                }
            },
            webpackConfig: {
                four: 4,
                five: 5,
                six: 6
            }
        });

        expect(inputs).toEqual({
            region: "test-region",
            bucket: "test-bucket",
            functions: {
                apolloService: {
                    memory: 1,
                    timeout: 2,
                    database: {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    uploadMinFileSize: 3,
                    uploadMaxFileSize: 4,
                    env: {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    webpackConfig: null
                },
                downloadFile: {
                    memory: 5,
                    timeout: 6,
                    env: {}
                },
                imageTransformer: {
                    memory: 7,
                    timeout: 8,
                    env: {}
                }
            },
            name: "test-File",
            webpackConfig: {
                four: 4,
                five: 5,
                six: 6
            }
        });
    });
});

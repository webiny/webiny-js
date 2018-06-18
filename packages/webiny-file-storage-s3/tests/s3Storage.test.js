import AWS from "aws-sdk";
import s3MockResponses from "./s3MockResponses";
import sinon from "sinon";
import fecha from "fecha";
import S3StorageDriver from "./../src";
import type { S3StorageDriverConfig } from "../src";

describe("S3StorageDriver class test", () => {
    afterEach(() => {
        if (typeof AWS.S3.prototype.makeRequest.restore === "function") {
            AWS.S3.prototype.makeRequest.restore();
        }
    });

    const params: S3StorageDriverConfig = {
        // s3 config keys
        bucket: "testBucket",
        accessKeyId: "AWS_AccessKeyId",
        secretAccessKey: "AWS_SecretAccessKey",
        region: "us-east-2",
        endpoint: "s3.us-east-2.amazonaws.com",
        paramValidation: true,
        // driver config keys
        createDatePrefix: false,
        directory: "",
        publicUrl: "https://cdn.domain.com"
    };
    const s3Driver = new S3StorageDriver(params);

    test("should both Key and Bucket be passed, S3 should return the object", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("getObject")
            .callsFake((operation, params) => {
                expect(params.Key).toBe("testKey");
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(s3MockResponses.getObject.success);
                        });
                    }
                };
            });

        const file = await s3Driver.getFile("testKey");
        expect(file.body).toBe("fooBar");
        await expect(s3Driver.getFile("testKey", { opt1: "test" })).rejects.toThrow();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should fail when trying to save a file with an empty body", async () => {
        await expect(s3Driver.setFile("testKey", { body: null })).rejects.toThrow();
    });

    test("should contact AWS S3 API to store the file", async () => {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("putObject")
            .callsFake((operation, params) => {
                expect(params.Key).toBe("testKey");
                expect(params.Bucket).toBe("testBucket");
                expect(params.Metadata[0]).toEqual({ "Cache-Control": "max-age=86400" });
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(params.Key);
                        });
                    }
                };
            });

        const key = await s3Driver.setFile("testKey", {
            body: "fooBar",
            meta: [{ "Cache-Control": "max-age=86400" }]
        });
        expect(key).toBe("testKey");
        expect(stub.calledOnce).toBeTrue();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should create a key that has a date prefix", async () => {
        // create a new driver instance with different config
        let tempParams = Object.assign({}, params);
        tempParams.createDatePrefix = true;
        tempParams.directory = "temp";
        const tempDriver = new S3StorageDriver(tempParams);

        const expectedKey = "temp/" + fecha.format(Date.now(), "YYYY/MM/DD") + "/testKey";
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("putObject")
            .callsFake((operation, params) => {
                expect(params.Key).toBe(expectedKey);
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(params.Key);
                        });
                    }
                };
            });

        const key = await tempDriver.setFile("testKey", { body: "fooBar" });
        expect(key).toBe(expectedKey);
        expect(stub.calledOnce).toBeTrue();
        const newKey = await tempDriver.setFile(key, { body: "fooBar" });
        expect(newKey).toBe(key);
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should return object meta", () => {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Key).toBe("testKey");
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(s3MockResponses.headObject.success);
                        });
                    }
                };
            });

        return s3Driver.getMeta("testKey").then(data => {
            expect(stub.calledOnce).toBeTrue();
            AWS.S3.prototype.makeRequest.restore();
            expect(data).toContainAnyKeys(["AcceptRanges", "ContentLength"]);
            expect(data["Body"]).toBeUndefined();
        });
    });

    test("should set the object meta and submit a request to S3 API", () => {
        const stub = sinon.stub(AWS.S3.prototype, "makeRequest");
        stub.withArgs("getObject").callsFake((operation, params) => {
            expect(params.Key).toBe("testKey");
            return {
                promise: () => {
                    return new Promise(resolve => {
                        resolve(s3MockResponses.getObject.success);
                    });
                }
            };
        });

        stub.withArgs("putObject").callsFake((operation, params) => {
            expect(params.Key).toBe("testKey");
            expect(params.Bucket).toBe("testBucket");
            expect(params.Body).toBe("fooBar");
            expect(params.Metadata.testKey).toBe("testValue");
            expect(params.Metadata.ContentType).toBe("image/jpeg");
            return {
                promise: () => {
                    return new Promise(resolve => {
                        resolve(s3MockResponses.headObject.success);
                    });
                }
            };
        });

        return s3Driver.setMeta("testKey", { testKey: "testValue" }).then(data => {
            AWS.S3.prototype.makeRequest.restore();
            expect(data).toBeTrue();
        });
    });

    test("should check if the given object exists", async () => {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            if (params.Key == "testKey") {
                                resolve(true);
                            }

                            reject("Object does not exist");
                        });
                    }
                };
            });

        expect(await s3Driver.exists("testKey")).toBeTrue();
        expect(await s3Driver.exists("testKey2")).toBeFalse();

        AWS.S3.prototype.makeRequest.restore();
    });

    test("should list all the objects inside an S3 bucket", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("listObjectsV2")
            .callsFake((operation, params) => {
                expect(params.Prefix).toBe("dir1");
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(s3MockResponses.listObjectsV2.success);
                        });
                    }
                };
            });

        await expect(s3Driver.getKeys("dir1", "happy")).resolves.toContainValue(
            "dir1/happyface.jpg"
        );
        await expect(s3Driver.getKeys("dir1")).resolves.toContainValues([
            "dir2/foo.jpg",
            "dir1/happyface.jpg",
            "dir1/test.jpg"
        ]);
        await expect(s3Driver.getKeys()).rejects.toThrow();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should list all the objects inside an S3 bucket using continuation token", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("listObjectsV2")
            .onFirstCall()
            .returns({
                promise: () => {
                    return new Promise(resolve => {
                        resolve(s3MockResponses.listObjectsV2Truncate1.success);
                    });
                }
            })
            .onSecondCall()
            .returns({
                promise: () => {
                    return new Promise(resolve => {
                        resolve(s3MockResponses.listObjectsV2Truncate2.success);
                    });
                }
            });

        await expect(s3Driver.getKeys("dir1")).resolves.toContainValues([
            "dir2/foo.jpg",
            "dir1/happyface.jpg"
        ]);
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should return empty result in case Contents is not an Array", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("listObjectsV2")
            .callsFake(() => {
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(s3MockResponses.listObjectsV2Empty.success);
                        });
                    }
                };
            });

        await expect(s3Driver.getKeys("dir1")).resolves.toBeEmpty();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should call S3 API to delete the given object", () => {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("deleteObject")
            .callsFake((operation, params) => {
                expect(params.Key).toBe("testKey");
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(true);
                        });
                    }
                };
            });

        return s3Driver.delete("testKey").then(data => {
            expect(data).toBeTrue();
            expect(stub.calledOnce).toBeTrue();
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    test("should copy the object under a new name and delete the old one", () => {
        const stub = sinon.stub(AWS.S3.prototype, "makeRequest");
        stub.withArgs("copyObject").callsFake((operation, params) => {
            expect(params.Key).toBe("newKey");
            expect(params.Bucket).toBe("testBucket");
            expect(params.CopySource).toBe("/testBucket/testKey");
            return {
                promise: () => {
                    return new Promise(resolve => {
                        resolve(true);
                    });
                }
            };
        });

        stub.withArgs("deleteObject").callsFake((operation, params) => {
            expect(params.Key).toBe("testKey");
            expect(params.Bucket).toBe("testBucket");

            return {
                promise: () => {
                    return new Promise(resolve => {
                        resolve(true);
                    });
                }
            };
        });

        return s3Driver.rename("testKey", "newKey").then(data => {
            expect(data).toBeTrue();
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    test("should return the full url to the object", () => {
        // using public url
        let url = s3Driver.getURL("testKey");
        expect(url).toBe("https://cdn.domain.com/testKey");

        // no public url
        let tempParams = Object.assign({}, params);
        tempParams.publicUrl = null;
        const tempDriver = new S3StorageDriver(tempParams);
        url = tempDriver.getURL("testKey");
        expect(url).toBe("https://s3.us-east-2.amazonaws.com/testBucket/testKey");
    });

    test("should call S3 API and return the ContentLength of the object", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            if (params.Key === "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        await expect(s3Driver.getSize("testKey")).resolves.toBe(3191);
        await expect(s3Driver.getSize("testKey2")).rejects.toThrow();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should call S3 API and return the LastModified time of the object", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            if (params.Key === "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        await expect(s3Driver.getTimeModified("testKey")).resolves.toBe(1471809113000);
        await expect(s3Driver.getTimeModified("testKey2")).rejects.toThrow();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should call S3 API and return the ContentType of the object", async () => {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).toBe("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            if (params.Key === "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        await expect(s3Driver.getContentType("testKey")).resolves.toBe("image/jpeg");
        await expect(s3Driver.getContentType("testKey2")).rejects.toThrow();
        AWS.S3.prototype.makeRequest.restore();
    });

    test("should reject a promise when trying to get the absolute path", async () => {
        await expect(s3Driver.getAbsolutePath("testKey")).resolves.toBe("testKey");
    });
});

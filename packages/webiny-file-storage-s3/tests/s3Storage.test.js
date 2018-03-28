import chai from "chai";
import chaiSubset from "chai-subset";
import chaiAsPromised from "chai-as-promised";
import AWS from "aws-sdk";
import s3MockResponses from "./s3MockResponses";
import sinon from "sinon";
import fecha from "fecha";
import S3StorageDriver from "./../src";
import type { S3StorageDriverConfig } from "../src";

chai.use(chaiSubset);
chai.use(chaiAsPromised);
chai.should();
const expect = chai.expect;

describe("S3StorageDriver class test", function() {
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

    it("should both Key and Bucket be passed, S3 should return the object", function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("getObject")
            .callsFake((operation, params) => {
                expect(params.Key).to.equal("testKey");
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            resolve(s3MockResponses.getObject.success);
                        });
                    }
                };
            });

        return Promise.all([
            s3Driver.getFile("testKey").should.eventually.contain({ body: "fooBar" }),
            s3Driver.getFile("testKey", { opt1: "test" }).should.be.rejected
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should fail when trying to save a file with an empty body", function() {
        expect(s3Driver.setFile("testKey", { body: null })).be.rejected;
    });

    it("should contact AWS S3 API to store the file", async function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("putObject")
            .callsFake((operation, params) => {
                expect(params.Key).to.equal("testKey");
                expect(params.Bucket).to.equal("testBucket");
                expect(params.Metadata[0]).to.deep.equal({ "Cache-Control": "max-age=86400" });
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            resolve(params.Key);
                        });
                    }
                };
            });

        const key = await s3Driver.setFile("testKey", {
            body: "fooBar",
            meta: [{ "Cache-Control": "max-age=86400" }]
        });
        expect(key).to.equal("testKey");
        expect(stub.calledOnce).to.be.true;
        AWS.S3.prototype.makeRequest.restore();
    });

    it("should create a key that has a date prefix", async function() {
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
                expect(params.Key).to.equal(expectedKey);
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise(resolve => {
                            resolve(params.Key);
                        });
                    }
                };
            });

        const key = await tempDriver.setFile("testKey", { body: "fooBar" });
        expect(key).to.equal(expectedKey);
        expect(stub.calledOnce).to.be.true;
        const newKey = await tempDriver.setFile(key, { body: "fooBar" });
        expect(newKey).to.equal(key);
        AWS.S3.prototype.makeRequest.restore();
    });

    it("should return object meta", function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Key).to.equal("testKey");
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            resolve(s3MockResponses.headObject.success);
                        });
                    }
                };
            });

        return s3Driver.getMeta("testKey").then(data => {
            expect(stub.calledOnce).to.be.true;
            AWS.S3.prototype.makeRequest.restore();
            expect(data).to.have.any.keys(["AcceptRanges", "ContentLength"]);
            expect(data).not.to.have.keys("Body");
        });
    });

    it("should set the object meta and submit a request to S3 API", function() {
        const stub = sinon.stub(AWS.S3.prototype, "makeRequest");
        stub.withArgs("getObject").callsFake((operation, params) => {
            expect(params.Key).to.equal("testKey");
            return {
                promise: () => {
                    return new Promise((resolve, reject) => {
                        resolve(s3MockResponses.getObject.success);
                    });
                }
            };
        });

        stub.withArgs("putObject").callsFake((operation, params) => {
            expect(params.Key).to.equal("testKey");
            expect(params.Bucket).to.equal("testBucket");
            expect(params.Body).to.equal("fooBar");
            expect(params.Metadata.testKey).to.equal("testValue");
            expect(params.Metadata.ContentType).to.equal("image/jpeg");
            return {
                promise: () => {
                    return new Promise((resolve, reject) => {
                        resolve(s3MockResponses.headObject.success);
                    });
                }
            };
        });

        return s3Driver.setMeta("testKey", { testKey: "testValue" }).then(data => {
            AWS.S3.prototype.makeRequest.restore();
            expect(data).to.be.true;
        });
    });

    it("should check if the given object exists", async function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            if (params.Key == "testKey") {
                                resolve(true);
                            }

                            reject("Object does not exist");
                        });
                    }
                };
            });

        expect(await s3Driver.exists("testKey")).to.be.true;
        expect(await s3Driver.exists("testKey2")).to.be.false;

        AWS.S3.prototype.makeRequest.restore();
    });

    it("should list all the objects inside an S3 bucket", function() {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("listObjectsV2")
            .callsFake((operation, params) => {
                expect(params.Prefix).to.equal("dir1");
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            resolve(s3MockResponses.listObjectsV2.success);
                        });
                    }
                };
            });

        return Promise.all([
            s3Driver.getKeys("dir1", "happy").should.eventually.contain("dir1/happyface.jpg"),
            s3Driver
                .getKeys("dir1")
                .should.eventually.contain.members([
                    "dir2/foo.jpg",
                    "dir1/happyface.jpg",
                    "dir1/test.jpg"
                ]),
            s3Driver.getKeys().should.be.rejected
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should list all the objects inside an S3 bucket using continuation token", function() {
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

        return Promise.all([
            s3Driver
                .getKeys("dir1")
                .should.eventually.contain.members(["dir2/foo.jpg", "dir1/happyface.jpg"])
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should return empty result in case Contents is not an Array", function() {
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

        return Promise.all([s3Driver.getKeys("dir1").should.eventually.be.empty]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should call S3 API to delete the given object", function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("deleteObject")
            .callsFake((operation, params) => {
                expect(params.Key).to.equal("testKey");
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            resolve(true);
                        });
                    }
                };
            });

        return s3Driver.delete("testKey").then(data => {
            expect(data).to.be.true;

            expect(stub.calledOnce).to.be.true;
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should copy the object under a new name and delete the old one", function() {
        const stub = sinon.stub(AWS.S3.prototype, "makeRequest");
        stub.withArgs("copyObject").callsFake((operation, params) => {
            expect(params.Key).to.equal("newKey");
            expect(params.Bucket).to.equal("testBucket");
            expect(params.CopySource).to.equal("/testBucket/testKey");
            return {
                promise: () => {
                    return new Promise((resolve, reject) => {
                        resolve(true);
                    });
                }
            };
        });

        stub.withArgs("deleteObject").callsFake((operation, params) => {
            expect(params.Key).to.equal("testKey");
            expect(params.Bucket).to.equal("testBucket");

            return {
                promise: () => {
                    return new Promise((resolve, reject) => {
                        resolve(true);
                    });
                }
            };
        });

        return s3Driver.rename("testKey", "newKey").then(data => {
            expect(data).to.be.true;
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should return the full url to the object", function() {
        // using public url
        let url = s3Driver.getURL("testKey");
        expect(url).to.equal("https://cdn.domain.com/testKey");

        // no public url
        let tempParams = Object.assign({}, params);
        tempParams.publicUrl = null;
        const tempDriver = new S3StorageDriver(tempParams);
        url = tempDriver.getURL("testKey");
        expect(url).to.equal("https://s3.us-east-2.amazonaws.com/testBucket/testKey");
    });

    it("should call S3 API and return the ContentLength of the object", async function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            if (params.Key == "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        return Promise.all([
            s3Driver.getSize("testKey").should.become(3191),
            s3Driver.getSize("testKey2").should.be.rejected
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });

        AWS.S3.prototype.makeRequest.restore();
    });

    it("should call S3 API and return the LastModified time of the object", async function() {
        sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            if (params.Key == "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        return Promise.all([
            s3Driver.getTimeModified("testKey").should.become(1471809113000),
            s3Driver.getTimeModified("testKey2").should.be.rejected
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should call S3 API and return the ContentType of the object", function() {
        const stub = sinon
            .stub(AWS.S3.prototype, "makeRequest")
            .withArgs("headObject")
            .callsFake((operation, params) => {
                expect(params.Bucket).to.equal("testBucket");
                return {
                    promise: () => {
                        return new Promise((resolve, reject) => {
                            if (params.Key == "testKey") {
                                resolve(s3MockResponses.headObject.success);
                            } else {
                                resolve({});
                            }
                        });
                    }
                };
            });

        return Promise.all([
            s3Driver.getContentType("testKey").should.become("image/jpeg"),
            s3Driver.getContentType("testKey2").should.be.rejected
        ]).then(() => {
            AWS.S3.prototype.makeRequest.restore();
        });
    });

    it("should reject a promise when trying to get the absolute path", function() {
        return Promise.resolve(s3Driver.getAbsolutePath("testKey").should.become("testKey"));
    });
});

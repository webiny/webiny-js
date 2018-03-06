import { expect } from "chai";
import compose from "webiny-compose";
import updatePackageJsonFactory from "../../src/plugins/updatePackageJson";

describe("[updatePackageJson] plugin test", function() {
    it("should update package version and versions of dependencies", async () => {
        const params = {
            packages: [
                {
                    name: "package-1",
                    packageJSON: {
                        name: "package-1",
                        version: "0.0.0-semantically-released",
                        dependencies: {
                            lodash: "^4.17.5",
                            "package-2": "0.0.0-semantically-released",
                            "package-3": "0.0.0-semantically-released"
                        }
                    },
                    nextRelease: {
                        version: "1.0.0"
                    }
                },
                {
                    name: "package-2",
                    packageJSON: {
                        name: "package-2",
                        version: "0.0.0-semantically-released"
                    },
                    lastRelease: {
                        version: "1.5.0"
                    },
                    nextRelease: {
                        version: "1.6.0"
                    }
                },
                {
                    name: "package-3",
                    packageJSON: {
                        name: "package-3",
                        version: "0.0.0-semantically-released",
                        dependencies: {
                            "package-4": "0.0.0-semantically-released"
                        }
                    },
                    lastRelease: {
                        version: "4.7.2"
                    }
                }
            ]
        };

        await compose([updatePackageJsonFactory()])(params);

        const [pkg1, pkg2, pkg3] = params.packages.map(p => p.packageJSON);

        expect(pkg1.version).to.equal("1.0.0");
        expect(pkg1.dependencies["package-2"]).to.equal("^1.6.0");
        expect(pkg1.dependencies["package-3"]).to.equal("^4.7.2");

        expect(pkg2.version).to.equal("1.6.0");
        expect(pkg2.dependencies).to.be.undefined;

        expect(pkg3.version).to.equal("0.0.0-semantically-released");
        expect(pkg3.dependencies["package-4"]).to.equal("0.0.0-semantically-released");
    });
});

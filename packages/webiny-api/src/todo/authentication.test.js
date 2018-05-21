import { Entity } from "webiny-api";
import { MemoryDriver } from "webiny-entity-memory";
import addDays from "date-fns/add_days";
import Security from "../src/services/security";
import MyUser from "./entities/myUser";
import chai from "./utils/chai";
import credentialsStrategy from "../src/strategies/credentialsStrategy";
import JwtToken from "../src/tokens/jwtToken";
import AuthenticationError from "../src/services/authenticationError";
import registerAttributes from "./../src/attributes/registerAttributes";

const { expect } = chai;

describe("Authentication test", () => {
    let auth: Security = null;
    let token: string = null;

    const authConfig = {
        token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
        strategies: {
            credentials: credentialsStrategy({
                credentials: req => {
                    return { username: req.username, password: req.password };
                }
            })
        },
        identities: [
            {
                identity: MyUser,
                authenticate: [
                    {
                        strategy: "credentials",
                        expiresOn: () => addDays(new Date(), 30),
                        apiMethod: {
                            name: "Auth.MyUser.Login",
                            pattern: "/login-user"
                        }
                    }
                ]
            }
        ]
    };

    before(() => {
        // Create Authentication service
        auth = new Security(authConfig);
        // Register attributes
        registerAttributes(auth);
        // Configure Memory entity driver
        Entity.driver = new MemoryDriver();
        // Insert test user
        const user = new MyUser();
        user.populate({ username: "admin@webiny.com", password: "dev" });
        const user2 = new MyUser();
        user2.populate({ username: "test@webiny.com", password: "admin" });
        return Promise.all([user.save(), user2.save()]);
    });

    it("should authenticate and return user instance", async () => {
        const login = await auth.authenticate(
            { username: "admin@webiny.com", password: "dev" },
            MyUser,
            "credentials"
        );
        expect(login).to.be.instanceof(MyUser);
        expect(login.username).to.equal("admin@webiny.com");
        expect(login.password).to.not.equal("dev");
    });

    it("should create an authentication token", async () => {
        const login = await auth.authenticate(
            { username: "admin@webiny.com", password: "dev" },
            MyUser,
            "credentials"
        );
        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        token = await auth.createToken(login, expiresOn);

        expect(token).to.be.a("string");
        return auth.verifyToken(token).should.be.fulfilled.then(identity => {
            expect(identity.id).to.equal(login.id);
            expect(identity.classId).to.equal(MyUser.classId);
        });
    });

    it("should load identity from token", async () => {
        const login = await auth.verifyToken(token);
        expect(login).to.be.instanceof(MyUser);
        expect(login.username).to.equal("admin@webiny.com");
    });

    it("should throw INVALID_CREDENTIALS", async () => {
        return auth
            .authenticate(
                {
                    username: "wrong",
                    password: "pass"
                },
                MyUser,
                "credentials"
            )
            .should.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.code).to.equal(AuthenticationError.INVALID_CREDENTIALS);
            });
    });

    it("should throw INVALID_CREDENTIALS", async () => {
        return auth
            .authenticate(
                {
                    username: "admin@webiny.com",
                    password: "pass"
                },
                MyUser,
                "credentials"
            )
            .should.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.code).to.equal(AuthenticationError.INVALID_CREDENTIALS);
            });
    });

    it("should throw IDENTITY_INSTANCE_NOT_FOUND", async () => {
        const login = await auth.authenticate(
            {
                username: "test@webiny.com",
                password: "admin"
            },
            MyUser,
            "credentials"
        );
        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        const token = await auth.createToken(login, expiresOn);
        const user = await MyUser.findOne({ query: { username: "test@webiny.com" } });
        await user.delete();

        return auth
            .verifyToken(token)
            .should.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.code).to.equal(AuthenticationError.IDENTITY_INSTANCE_NOT_FOUND);
            });
    });

    it("should throw UNKNOWN_STRATEGY", async () => {
        return auth
            .authenticate(
                {
                    username: "wrong",
                    password: "pass"
                },
                MyUser,
                "uknown"
            )
            .should.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.code).to.equal(AuthenticationError.UNKNOWN_STRATEGY);
            });
    });

    it("should throw UNKNOWN_IDENTITY", async () => {
        const tokenProvider = new JwtToken({
            secret: "MyS3cr3tK3Y",
            data: identity => {
                return {
                    identityId: identity.id,
                    classId: "UnknownClass"
                };
            }
        });

        const user = MyUser.findOne({ query: { username: "admin@webiny.com" } });
        const expiresOn = Math.floor(addDays(new Date(), 1).getTime() / 1000);
        const token = await tokenProvider.encode(user, expiresOn);

        return auth
            .verifyToken(token)
            .should.be.rejectedWith(AuthenticationError)
            .then(err => {
                expect(err.code).to.equal(AuthenticationError.UNKNOWN_IDENTITY);
            });
    });
});

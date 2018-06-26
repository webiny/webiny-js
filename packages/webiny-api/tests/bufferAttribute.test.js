import { api } from "webiny-api";
import { ModelError } from "webiny-model";
import BufferEntity from "./entities/BufferEntity";
import registerIdentityAttribute from "./../src/attributes/registerIdentityAttribute";
import registerBufferAttribute from "./../src/attributes/registerBufferAttribute";
import SecurityService from "../src/services/securityService";
import MyUser from "./entities/myUser";
import JwtToken from "../src/security/tokens/jwtToken";

describe("Buffer attribute test", () => {
    beforeAll(() => {
        // Register service (for identity attribute).
        api.services.register("security", () => {
            return new SecurityService({
                token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                identities: [
                    {
                        identity: MyUser
                    }
                ]
            });
        });

        // Register attributes.
        registerIdentityAttribute();
        registerBufferAttribute();
    });

    test("when setting value, should transform string to buffer", async () => {
        const user = new BufferEntity();
        user.buffer = "12345";
        expect(user.buffer).toBeInstanceOf(Buffer);
    });

    test("when setting value from storage, should transform string to buffer", async () => {
        const user = new BufferEntity();
        user.getAttribute("buffer").setStorageValue("1234567890");
        expect(user.buffer).toBeInstanceOf(Buffer);
        expect(user.getAttribute("buffer").value.isClean()).toBe(true);
    });

    test("should throw an error if string or buffer is not set", async () => {
        const user = new BufferEntity();
        user.buffer = ["123"];

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
    });
});

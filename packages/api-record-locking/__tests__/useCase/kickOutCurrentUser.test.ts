import { KickOutCurrentUserUseCase } from "~/useCases/KickOutCurrentUser/KickOutCurrentUserUseCase";
import { IWebsocketsContextObject } from "@webiny/api-websockets";
import { createIdentity } from "~tests/helpers/identity";
import { IRecordLockingLockRecord } from "~/types";

describe("kick out current user", () => {
    it("should send message via websockets to kick out current user", async () => {
        const websocketsSend = jest.fn(async () => {
            return;
        });

        const kickOutUserUseCase = new KickOutCurrentUserUseCase({
            getIdentity: () => {
                return {
                    id: "identity-id",
                    displayName: "identity-display-name",
                    type: "identity-type"
                };
            },
            getWebsockets: () => {
                return {
                    send: websocketsSend
                } as unknown as IWebsocketsContextObject;
            }
        });

        const mockRecord = {
            id: "aTestId#0001",
            lockedOn: new Date("2020-01-01"),
            lockedBy: createIdentity(),
            toObject: () => {
                return {
                    id: "aTestId#0001",
                    lockedOn: new Date("2020-01-01"),
                    lockedBy: createIdentity()
                };
            }
        } as unknown as IRecordLockingLockRecord;

        let error: Error | null = null;
        try {
            await kickOutUserUseCase.execute({
                ...mockRecord
            });
        } catch (ex) {
            error = ex;
        }
        expect(error).toBeNull();

        expect(websocketsSend).toHaveBeenCalledOnce();
    });
});

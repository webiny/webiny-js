import type { IWebsocketsEventValidator } from "~/validator/abstractions/IWebsocketsEventValidator";
import type { IWebsocketsEvent, IWebsocketsEventData } from "~/types";

export class MockWebsocketsEventValidator implements IWebsocketsEventValidator {
    public async validate<T extends IWebsocketsEventData = IWebsocketsEventData>(
        input: unknown
    ): Promise<IWebsocketsEvent<T>> {
        const raw = input as Record<string, any>;
        return {
            context: {
                ...(raw?.context || {})
            },
            body: raw?.body
                ? (() => {
                      if (typeof raw.body !== "string") {
                          return raw.body;
                      }
                      try {
                          return JSON.parse(raw.body);
                      } catch {
                          return {};
                      }
                  })()
                : {}
        } as unknown as IWebsocketsEvent<T>;
    }
}

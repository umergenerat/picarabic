// Type declarations for Deno runtime
// This file helps the IDE understand Deno-specific types

declare namespace Deno {
    export interface Env {
        get(key: string): string | undefined;
        set(key: string, value: string): void;
        delete(key: string): void;
        toObject(): Record<string, string>;
    }
    export const env: Env;
}

declare module "std/http/server.ts" {
    export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

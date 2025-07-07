import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

/**
 * This route enables draft mode and redirects to the requested page pathname.
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("wb.preview.pathname");

    const targetPathname = `${pathname}?wb.preview=true`;

    // TODO: implement access control, if you want to secure your preview.

    // Enable Draft Mode by setting the cookie
    const draft = await draftMode();
    draft.enable();

    redirect(targetPathname);
}

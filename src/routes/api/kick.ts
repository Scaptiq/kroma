import { json } from "solid-start";

export async function GET({ request }: { request: Request }) {
    const url = new URL(request.url);
    const channel = url.searchParams.get("channel");

    if (!channel) {
        return json({ error: "Missing channel" }, { status: 400 });
    }

    const headers = {
        Accept: "application/json",
        "User-Agent": "kroma-chat"
    };

    let channelData: any = null;
    let chatroomData: any = null;
    let channelStatus = 0;
    let chatroomStatus = 0;

    try {
        const res = await fetch(`https://kick.com/api/v2/channels/${channel}`, { headers });
        channelStatus = res.status;
        if (res.ok) {
            channelData = await res.json();
        }
    } catch (e) {
        // Swallow; caller handles nulls
    }

    try {
        const res = await fetch(`https://kick.com/api/v2/channels/${channel}/chatroom`, { headers });
        chatroomStatus = res.status;
        if (res.ok) {
            chatroomData = await res.json();
        }
    } catch (e) {
        // Swallow; caller handles nulls
    }

    const chatroomId =
        channelData?.chatroom?.id ??
        chatroomData?.id ??
        chatroomData?.chatroom_id ??
        null;

    return json({
        channel: channelData,
        chatroom: chatroomData,
        chatroomId,
        status: {
            channel: channelStatus,
            chatroom: chatroomStatus
        }
    });
}

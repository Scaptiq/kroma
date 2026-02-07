import { useParams, useSearchParams, useLocation, useNavigate } from "solid-start";
import { createEffect } from "solid-js";
import ChatRoute from "~/routes/v3/chat/[channel]";
import { parseChatConfig } from "~/utils/chatConfig";

export default function ChatAliasRoute() {
    const params = useParams<{ channel?: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const navigate = useNavigate();

    createEffect(() => {
        const config = parseChatConfig(params, searchParams);
        const platforms = config.platforms;
        const channelSegment = params.channel ? `/${params.channel}` : '';
        const basePath = platforms.length > 1
            ? '/chat/combined'
            : `/chat/${platforms[0]}${channelSegment}`;
        const nextPath = `${basePath}${location.search}`;
        if (nextPath !== `${location.pathname}${location.search}`) {
            navigate(nextPath, { replace: true });
        }
    });

    return <ChatRoute />;
}

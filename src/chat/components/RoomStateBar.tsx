import { Show } from "solid-js";

export type RoomState = {
    slowMode: number;
    emoteOnly: boolean;
    followersOnly: number;
    subsOnly: boolean;
    r9k: boolean;
};

interface RoomStateBarProps {
    show: boolean;
    roomState: RoomState;
}

export default function RoomStateBar(props: RoomStateBarProps) {
    const state = () => props.roomState;

    return (
        <Show when={props.show}>
            <div class="room-state-bar">
                <Show when={state().slowMode > 0}>
                    <span class="room-state-badge room-state-badge--slow">
                        🐢 Slow Mode: {state().slowMode}s
                    </span>
                </Show>
                <Show when={state().emoteOnly}>
                    <span class="room-state-badge room-state-badge--emote">
                        😀 Emote Only
                    </span>
                </Show>
                <Show when={state().followersOnly >= 0}>
                    <span class="room-state-badge room-state-badge--followers">
                        💜 Followers{state().followersOnly > 0 ? ` (${state().followersOnly}m)` : ''}
                    </span>
                </Show>
                <Show when={state().subsOnly}>
                    <span class="room-state-badge room-state-badge--subs">
                        ⭐ Sub Only
                    </span>
                </Show>
                <Show when={state().r9k}>
                    <span class="room-state-badge room-state-badge--r9k">
                        🤖 R9K
                    </span>
                </Show>
            </div>
        </Show>
    );
}

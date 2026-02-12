import { For, Show } from "solid-js";
import type { Accessor } from "solid-js";
import type { ChatConfig } from "~/utils/chatConfig";
import type { ChatMessage } from "~/utils/messageTypes";
import { getCheerTierColor } from "~/utils/messageTypes";
import { getMessagePlatform, getPlatformLabel, PLATFORM_LOGOS } from "~/utils/platforms";

interface ChatMessageProps {
    msg: ChatMessage;
    index: Accessor<number>;
    config: Accessor<ChatConfig>;
    getMessageClass: (msg: ChatMessage) => string;
    getMessageBubbleClass: (msg: ChatMessage) => string;
    formatTime: (timestamp: number) => string;
}

export default function ChatMessageItem(props: ChatMessageProps) {
    const cfg = () => props.config();

    return (
        <li
            class={props.getMessageClass(props.msg)}
            data-fading={cfg().fadeOutMessages ? "true" : "false"}
            style={{
                "animation-delay": `${props.index() * 20}ms, var(--fade-delay)`
            }}
        >
            <Show when={props.msg.reply && cfg().showReplies}>
                <div class="reply-context">
                    <svg style={{ width: '0.85em', height: '0.85em', "margin-right": '0.3em' }} class="text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fill-rule="evenodd"
                            d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clip-rule="evenodd"
                        />
                    </svg>
                    <span class="reply-context__username">@{props.msg.reply!.parentDisplayName}</span>
                    <span class="reply-context__body">{props.msg.reply!.parentMsgBody}</span>
                </div>
            </Show>

            <Show when={props.msg.isFirstMessage && cfg().showFirstMessage}>
                <div class="first-message-indicator mb-1 inline-block">
                    First Message
                </div>
            </Show>

            <div
                class={props.getMessageBubbleClass(props.msg)}
                data-effect={props.msg.effectVariant || props.msg.effect}
                style={{
                    ...(props.msg.isAction ? { color: props.msg.color } : {}),
                    ...(props.msg.effectColor ? { "--velora-effect-color": props.msg.effectColor } : {})
                }}
            >
                {(() => {
                    const isVeloraGift = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'gift-celebration';
                    const isVeloraSub = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'subscription-celebration';
                    const isVeloraPoints = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'points-celebration';
                    const isVeloraVolts = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'volts-celebration';
                    const isVeloraRaid = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'raid-celebration';
                    const isVeloraGiveaway = props.msg.platform === 'velora' && props.msg.veloraCard?.type === 'giveaway-result';
                    return (
                        <Show
                            when={isVeloraGift || isVeloraSub || isVeloraPoints || isVeloraVolts || isVeloraRaid || isVeloraGiveaway}
                            fallback={
                                <div class="flex items-start gap-2 flex-wrap leading-snug pointer-events-auto">
                                    <Show when={cfg().showTimestamps}>
                                        <span class="timestamp self-center">
                                            {props.formatTime(props.msg.timestamp)}
                                        </span>
                                    </Show>

                                    <Show when={props.msg.isShared && cfg().showSharedChat}>
                                        <div class="mr-2 flex items-center self-center" style={{ height: '1.2em' }}>
                                            <Show when={props.msg.sourceLogo}>
                                                <img
                                                    src={props.msg.sourceLogo}
                                                    alt={props.msg.sourceChannelName || "Source"}
                                                    class="rounded-full ring-1 ring-white/30"
                                                    style={{ width: '1.2em', height: '1.2em' }}
                                                    title={props.msg.sourceChannelName ? `From ${props.msg.sourceChannelName}` : "Shared Message"}
                                                />
                                            </Show>
                                        </div>
                                    </Show>

                                    <Show when={(cfg().showBadges && props.msg.badges.length > 0) || cfg().showPlatformBadge}>
                                        <div class="flex gap-1 self-center shrink-0 select-none items-center">
                                            <Show when={cfg().showPlatformBadge}>
                                                {(() => {
                                                    const platform = getMessagePlatform(props.msg, cfg().platforms);
                                                    return (
                                                        <img
                                                            src={PLATFORM_LOGOS[platform]}
                                                            alt={getPlatformLabel(platform)}
                                                            class="platform-logo"
                                                            loading="lazy"
                                                        />
                                                    );
                                                })()}
                                            </Show>
                                            <For each={props.msg.badges}>
                                                {(badge) => (
                                                    <img
                                                        src={badge.url}
                                                        alt={badge.title}
                                                        title={badge.title}
                                                        class="badge"
                                                        loading="lazy"
                                                    />
                                                )}
                                            </For>
                                        </div>
                                    </Show>

                                    <div class="flex items-baseline shrink-0">
                                        <Show when={props.msg.pronouns && cfg().showPronouns && props.msg.platform === 'twitch'}>
                                            <span
                                                class={`${cfg().pridePronouns ? 'pronouns-badge--pride' : 'pronouns-badge--colored'} mr-1.5`}
                                                style={!cfg().pridePronouns ? {
                                                    background: props.msg.pronounColor || '#A855F7',
                                                    "background-size": props.msg.pronounIsGradient ? '200% 200%' : undefined,
                                                    animation: props.msg.pronounIsGradient ? 'pride-shimmer 3s ease infinite' : undefined
                                                } : undefined}
                                            >
                                                {props.msg.pronouns}
                                            </span>
                                        </Show>

                                        <span
                                            class={`username ${props.msg.paint ? 'username--painted' : ''}`}
                                            style={{
                                                color: props.msg.paint ? undefined : props.msg.color,
                                                ...(props.msg.paint || {})
                                            }}
                                        >
                                            {props.msg.displayName}
                                        </span>

                                        <Show when={!props.msg.isAction}>
                                            <span class="separator">:</span>
                                        </Show>
                                    </div>

                                    <Show when={props.msg.bits}>
                                        <span
                                            class="cheer-amount animate-pop-in"
                                            style={{ color: getCheerTierColor(props.msg.bits!) }}
                                        >
                                            <svg style={{ width: '1em', height: '1em' }} viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" />
                                            </svg>
                                            {props.msg.bits}
                                        </span>
                                    </Show>

                                    <span
                                        class="break-words message-content"
                                        style={props.msg.isAction ? { color: props.msg.color } : undefined}
                                    >
                                        <For each={props.msg.parsedContent}>
                                            {(part) => (
                                                <>
                                                    {typeof part === 'string' ? (
                                                        <span>{part}</span>
                                                    ) : part.type === 'emote' ? (
                                                        <img
                                                            src={part.url}
                                                            alt={part.name}
                                                            title={part.name}
                                                            class={`emote ${part.isZeroWidth ? 'emote--zero-width' : ''}`}
                                                            loading="lazy"
                                                        />
                                                    ) : part.type === 'cheer' ? (
                                                        <span class="inline-flex items-center gap-0.5 mx-0.5" style={{ color: part.color }}>
                                                            <img src={part.url} alt={part.prefix} style={{ height: '1.2em', width: '1.2em' }} loading="lazy" />
                                                            <span class="font-bold" style={{ "font-size": '0.85em' }}>{part.bits}</span>
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </For>
                                    </span>
                                </div>
                            }
                        >
                            {(() => {
                                if (isVeloraGift) {
                                    const payload = props.msg.veloraCard?.payload || {};
                                    const gifter = payload.gifter || {};
                                    const giftCount = typeof payload.giftCount === "number" ? payload.giftCount : 1;
                                    const tierRaw = typeof payload.tier === "string" ? payload.tier : "tier1";
                                    const tierLabel = tierRaw.replace(/tier\s*/i, "TIER ").toUpperCase();
                                    const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
                                    const messageText = typeof payload.message === "string" ? payload.message.trim() : "";
                                    return (
                                        <div
                                            class="velora-giftcard"
                                            style={{ "--velora-accent": props.msg.accentColor || "#b9a7ff" }}
                                        >
                                            <div class="velora-giftcard__header">
                                                <div class="velora-giftcard__avatar">
                                                    <img
                                                        src={gifter.avatarUrl || props.msg.avatarUrl || ""}
                                                        alt={gifter.displayName || gifter.username || props.msg.displayName}
                                                        class="velora-giftcard__avatar-img"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div class="velora-giftcard__header-text">
                                                    <div class="velora-giftcard__gifter">
                                                        {gifter.displayName || gifter.username || props.msg.displayName}
                                                    </div>
                                                    <div class="velora-giftcard__pill">
                                                        <span class="velora-giftcard__pill-icon">🎁</span>
                                                        <span>{giftCount} Gift • {tierLabel}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="velora-giftcard__recipients">
                                                <div class="velora-giftcard__recipients-title">Recipients</div>
                                                <div class="velora-giftcard__recipients-list">
                                                    <For each={recipients}>
                                                        {(recipient: any) => (
                                                            <div class="velora-giftcard__recipient">
                                                                <span class="velora-giftcard__dot" />
                                                                <span>{recipient.displayName || recipient.username || "Viewer"}</span>
                                                            </div>
                                                        )}
                                                    </For>
                                                </div>
                                                <Show when={messageText}>
                                                    <div class="velora-giftcard__message">{messageText}</div>
                                                </Show>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isVeloraPoints) {
                                    const payload = props.msg.veloraCard?.payload || {};
                                    const displayName = payload.displayName || payload.username || props.msg.displayName;
                                    const avatarUrl = payload.avatarUrl || props.msg.avatarUrl || "";
                                    const rewardName = payload.itemName || payload.rewardName || "Reward";
                                    const cost = typeof payload.cost === "number" ? payload.cost : null;
                                    return (
                                        <div
                                            class="velora-pointscard"
                                            style={{ "--velora-accent": props.msg.accentColor || "#c4a8ff" }}
                                        >
                                            <div class="velora-pointscard__avatar">
                                                <img
                                                    src={avatarUrl}
                                                    alt={displayName}
                                                    class="velora-pointscard__avatar-img"
                                                    loading="lazy"
                                                />
                                            </div>
                                            <div class="velora-pointscard__text">
                                                <div class="velora-pointscard__name">{displayName}</div>
                                                <div class="velora-pointscard__status">Redeemed {rewardName}</div>
                                            </div>
                                            <div class="velora-pointscard__pill">
                                                {cost !== null ? `${cost} Points` : 'Channel Points'}
                                            </div>
                                        </div>
                                    );
                                }

                                if (isVeloraVolts) {
                                    const payload = props.msg.veloraCard?.payload || {};
                                    const sender = payload.sender || {};
                                    const displayName = sender.displayName || sender.username || props.msg.displayName;
                                    const avatarUrl = sender.avatarUrl || props.msg.avatarUrl || "";
                                    const amount = typeof payload.amount === "number" ? payload.amount : null;
                                    const messageText = typeof payload.message === "string" ? payload.message.trim() : "";
                                    return (
                                        <div
                                            class="velora-voltscard"
                                            style={{ "--velora-accent": props.msg.accentColor || "#9bdcff" }}
                                        >
                                            <div class="velora-voltscard__header">
                                                <div class="velora-voltscard__avatar">
                                                    <img
                                                        src={avatarUrl}
                                                        alt={displayName}
                                                        class="velora-voltscard__avatar-img"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div class="velora-voltscard__header-text">
                                                    <div class="velora-voltscard__name">{displayName}</div>
                                                    <div class="velora-voltscard__pill">
                                                        <span class="velora-voltscard__bolt">⚡</span>
                                                        {amount !== null ? `${amount} Volts` : "Volts"}
                                                    </div>
                                                    <Show when={messageText}>
                                                        <div class="velora-voltscard__message">{messageText}</div>
                                                    </Show>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (isVeloraRaid) {
                                    const payload = props.msg.veloraCard?.payload || {};
                                    const raider = payload.raider || {};
                                    const raiderName = raider.displayName || raider.username || props.msg.displayName;
                                    const avatarUrl = raider.avatarUrl || props.msg.avatarUrl || "";
                                    const viewerCount = typeof payload.viewerCount === "number" ? payload.viewerCount : null;
                                    const messageText = typeof payload.message === "string" ? payload.message.trim() : "";
                                    return (
                                        <div
                                            class="velora-raidcard"
                                            style={{ "--velora-accent": props.msg.accentColor || "#ff8ea1" }}
                                        >
                                            <div class="velora-raidcard__header">
                                                <div class="velora-raidcard__avatar">
                                                    <img
                                                        src={avatarUrl}
                                                        alt={raiderName}
                                                        class="velora-raidcard__avatar-img"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div class="velora-raidcard__header-text">
                                                    <div class="velora-raidcard__name">{raiderName}</div>
                                                    <div class="velora-raidcard__status">Sent a Raid</div>
                                                </div>
                                                <div class="velora-raidcard__pill">
                                                    <span class="velora-raidcard__pill-icon">🎉</span>
                                                    {viewerCount !== null ? `${viewerCount} Viewers` : "Raid"}
                                                </div>
                                            </div>
                                            <Show when={messageText}>
                                                <div class="velora-raidcard__message">{messageText}</div>
                                            </Show>
                                        </div>
                                    );
                                }

                                if (isVeloraGiveaway) {
                                    const payload = props.msg.veloraCard?.payload || {};
                                    const title = typeof payload.title === "string" && payload.title.trim()
                                        ? payload.title.trim()
                                        : "Giveaway";
                                    const description = typeof payload.description === "string" ? payload.description.trim() : "";
                                    const statusRaw = typeof payload.status === "string" ? payload.status : "";
                                    const statusLabel = statusRaw ? statusRaw.replace(/_/g, " ").toUpperCase() : "RESULT";
                                    const totalEntries = typeof payload.totalEntries === "number" ? payload.totalEntries : null;
                                    const winners = Array.isArray(payload.winners) ? payload.winners : [];
                                    const winner = (payload.winner && typeof payload.winner === "object")
                                        ? payload.winner
                                        : winners[0] || null;
                                    const winnerName = winner
                                        ? winner.displayName || winner.username || "Winner"
                                        : null;
                                    const winnerAvatar = winner?.avatarUrl || "";
                                    const winnerCount = typeof payload.winnerCount === "number"
                                        ? payload.winnerCount
                                        : winners.length;
                                    return (
                                        <div
                                            class="velora-giveawaycard"
                                            style={{ "--velora-accent": props.msg.accentColor || "#f1c85f" }}
                                        >
                                            <div class="velora-giveawaycard__header">
                                                <div class="velora-giveawaycard__icon" aria-hidden="true">🏆</div>
                                                <div class="velora-giveawaycard__header-text">
                                                    <div class="velora-giveawaycard__title">{title}</div>
                                                    <div class="velora-giveawaycard__status">{statusLabel}</div>
                                                </div>
                                                <Show when={totalEntries !== null}>
                                                    <div class="velora-giveawaycard__pill">
                                                        {totalEntries!.toLocaleString()} Entr{totalEntries === 1 ? "y" : "ies"}
                                                    </div>
                                                </Show>
                                            </div>
                                            <Show when={description}>
                                                <div class="velora-giveawaycard__description">{description}</div>
                                            </Show>
                                            <Show when={winnerName}>
                                                <div class="velora-giveawaycard__winner">
                                                    <Show when={winnerAvatar}>
                                                        <img
                                                            src={winnerAvatar}
                                                            alt={winnerName || "Winner"}
                                                            class="velora-giveawaycard__winner-avatar"
                                                            loading="lazy"
                                                        />
                                                    </Show>
                                                    <div class="velora-giveawaycard__winner-text">
                                                        <div class="velora-giveawaycard__winner-label">Winner</div>
                                                        <div class="velora-giveawaycard__winner-name">{winnerName}</div>
                                                    </div>
                                                </div>
                                            </Show>
                                            <Show when={!winnerName && winnerCount > 0}>
                                                <div class="velora-giveawaycard__winner-count">
                                                    {winnerCount} winner{winnerCount === 1 ? "" : "s"} drawn
                                                </div>
                                            </Show>
                                        </div>
                                    );
                                }

                                const payload = props.msg.veloraCard?.payload || {};
                                const subscriber = payload.subscriber || {};
                                const tierRaw = typeof payload.tier === "string" ? payload.tier : "tier1";
                                const tierLabel = tierRaw.replace(/tier\s*/i, "TIER ").toUpperCase();
                                return (
                                    <div
                                        class="velora-subcard"
                                        style={{ "--velora-accent": props.msg.accentColor || "#7db4ff" }}
                                    >
                                        <div class="velora-subcard__avatar">
                                            <img
                                                src={subscriber.avatarUrl || props.msg.avatarUrl || ""}
                                                alt={subscriber.displayName || subscriber.username || props.msg.displayName}
                                                class="velora-subcard__avatar-img"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div class="velora-subcard__text">
                                            <div class="velora-subcard__name">
                                                {subscriber.displayName || subscriber.username || props.msg.displayName}
                                            </div>
                                            <div class="velora-subcard__status">New Subscriber</div>
                                        </div>
                                        <div class="velora-subcard__tier">{tierLabel}</div>
                                    </div>
                                );
                            })()}
                        </Show>
                    );
                })()}
            </div>
        </li>
    );
}

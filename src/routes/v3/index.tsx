import { createSignal, Show, For, createEffect } from "solid-js";
import { useLocation, useNavigate } from "solid-start";

import MySiteTitle from "~/components/MySiteTitle";
import GradientSlider from "~/components/GradientSlider";
import { Button } from "~/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/Card";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Switch } from "~/components/ui/Switch";
import { PRESET_FONTS } from "~/utils/fonts";
import { buildChatSearchParams } from "~/utils/chatConfig";
import {
    type ChatPlatform,
    type PlatformTab,
    getChannelPlaceholder,
    getChannelPrefix,
    getPlatformLabel,
    sanitizeChannel,
    supportsBadges,
    supportsHighlights,
    supportsNamePaints,
    supportsNonVeloraHighlights,
    supportsRoomState,
} from "~/utils/platforms";

export default function ChatSetup() {
    const location = useLocation();
    const navigate = useNavigate();

    createEffect(() => {
        if (location.pathname.startsWith('/v3')) {
            navigate(`/setup${location.search}`, { replace: true });
        }
    });

    const [platformTab, setPlatformTab] = createSignal<PlatformTab>('twitch');
    const [combinedPlatforms, setCombinedPlatforms] = createSignal<ChatPlatform[]>(['twitch']);
    const [twitchChannel, setTwitchChannel] = createSignal("");
    const [kickChannel, setKickChannel] = createSignal("");
    const [youtubeChannel, setYoutubeChannel] = createSignal("");
    const [veloraChannel, setVeloraChannel] = createSignal("");
    const [showPronouns, setShowPronouns] = createSignal(true);
    const [showPlatformBadge, setShowPlatformBadge] = createSignal(true);
    const [showBadges, setShowBadges] = createSignal(true);
    const [showEmotes, setShowEmotes] = createSignal(true);
    const [showHighlights, setShowHighlights] = createSignal(true);
    const [showTimestamps, setShowTimestamps] = createSignal(false);
    const [showSharedChat, setShowSharedChat] = createSignal(true);
    const [showNamePaints, setShowNamePaints] = createSignal(true);
    const [showRoomState, setShowRoomState] = createSignal(false);
    const [showReplies, setShowReplies] = createSignal(true);
    const [pageBackground, setPageBackground] = createSignal<'transparent' | 'dim' | 'dark'>('transparent');
    const [messageBgOpacity, setMessageBgOpacity] = createSignal(0);
    const [textColor, setTextColor] = createSignal('#ffffff');
    const getSafeMessageBgOpacity = () => {
        const value = messageBgOpacity();
        return Number.isFinite(value) ? Math.min(0.9, Math.max(0, value)) : 0;
    };
    const [hideCommands, setHideCommands] = createSignal(false);
    const [hideBots, setHideBots] = createSignal(false);
    const [maxMessages, setMaxMessages] = createSignal(50);
    const [fontSize, setFontSize] = createSignal(16);
    const [emoteScale, setEmoteScale] = createSignal(1.0);
    const [fadeOutMessages, setFadeOutMessages] = createSignal(false);
    const [playSound, setPlaySound] = createSignal(false);
    const [fadeOutDelay, setFadeOutDelay] = createSignal(30);
    const [blockedUsers, setBlockedUsers] = createSignal("");
    const [customBots, setCustomBots] = createSignal("");
    const [selectedFont, setSelectedFont] = createSignal('Segoe UI');
    const [customFont, setCustomFont] = createSignal('');
    const [useCustomFont, setUseCustomFont] = createSignal(false);
    const [pridePronouns, setPridePronouns] = createSignal(false);
    const [streamTarget, setStreamTarget] = createSignal<'obs' | 'meld'>('obs');

    const [copied, setCopied] = createSignal(false);
    const [previewUrl, setPreviewUrl] = createSignal("");
    const [activeTab, setActiveTab] = createSignal(0);

    const getEffectiveFont = () => {
        if (useCustomFont() && customFont().trim()) {
            return customFont().trim();
        }
        return selectedFont();
    };

    const selectedPlatforms = () => platformTab() === 'combined' ? combinedPlatforms() : [platformTab() as ChatPlatform];
    const sectionPlatforms = () => platformTab() === 'combined' ? combinedPlatforms() : [platformTab() as ChatPlatform];

    const toggleCombinedPlatform = (value: ChatPlatform) => {
        setCombinedPlatforms(prev => {
            if (prev.includes(value)) {
                const next = prev.filter(p => p !== value);
                return next.length > 0 ? next : ['twitch'];
            }
            return [...prev, value];
        });
    };

    const hasPlatform = (value: ChatPlatform) => selectedPlatforms().includes(value);
    const anySupportsBadges = () => selectedPlatforms().some(supportsBadges);
    const anySupportsNamePaints = () => selectedPlatforms().some(supportsNamePaints);
    const anySupportsRoomState = () => selectedPlatforms().some(supportsRoomState);
    const anySupportsHighlights = () => selectedPlatforms().some(supportsHighlights);
    const anySupportsNonVeloraHighlights = () => selectedPlatforms().some(supportsNonVeloraHighlights);
    const hasVeloraSelected = () => selectedPlatforms().includes('velora');
    const highlightLabel = () => {
        if (hasVeloraSelected() && !anySupportsNonVeloraHighlights()) return 'Message Effects';
        if (hasVeloraSelected()) return 'Highlighted Messages + Message Effects';
        return 'Highlighted Messages';
    };

    const getChannelForPlatform = (value: ChatPlatform) => {
        switch (value) {
            case 'kick':
                return kickChannel();
            case 'youtube':
                return youtubeChannel();
            case 'velora':
                return veloraChannel();
            default:
                return twitchChannel();
        }
    };

    const setChannelForPlatform = (value: ChatPlatform, channelValue: string) => {
        switch (value) {
            case 'kick':
                setKickChannel(channelValue);
                break;
            case 'youtube':
                setYoutubeChannel(channelValue);
                break;
            case 'velora':
                setVeloraChannel(channelValue);
                break;
            default:
                setTwitchChannel(channelValue);
        }
    };

    const hasAnyChannel = () => selectedPlatforms().some((platform) => getChannelForPlatform(platform));

    const getChatBasePath = () => {
        if (platformTab() === 'combined') {
            return '/chat/combined';
        }
        const platform = platformTab() as ChatPlatform;
        const channelValue = getChannelForPlatform(platform);
        if (!channelValue) return '';
        return `/chat/${platform}/${channelValue}`;
    };

    const renderPlatformLabel = (platform: ChatPlatform) => getPlatformLabel(platform);

    const buildParams = () => buildChatSearchParams({
        platforms: selectedPlatforms(),
        twitchChannel: twitchChannel(),
        kickChannel: kickChannel(),
        youtubeChannel: youtubeChannel(),
        veloraChannel: veloraChannel(),
        includePlatformsParam: platformTab() === 'combined',
        includeChannelParams: platformTab() === 'combined',
        showPlatformBadge: showPlatformBadge(),
        showPronouns: showPronouns(),
        pridePronouns: pridePronouns(),
        showBadges: showBadges(),
        showEmotes: showEmotes(),
        showHighlights: showHighlights(),
        showTimestamps: showTimestamps(),
        showSharedChat: showSharedChat(),
        showNamePaints: showNamePaints(),
        showReplies: showReplies(),
        showRoomState: showRoomState(),
        hideCommands: hideCommands(),
        hideBots: hideBots(),
        maxMessages: maxMessages(),
        fontFamily: getEffectiveFont(),
        fontSize: fontSize(),
        emoteScale: emoteScale(),
        fadeOutMessages: fadeOutMessages(),
        fadeOutDelayMs: fadeOutDelay() * 1000,
        playSound: playSound(),
        blockedUsers: blockedUsers(),
        customBots: customBots(),
        pageBackground: pageBackground(),
        messageBgOpacity: getSafeMessageBgOpacity(),
        textColor: textColor(),
    });

    createEffect(() => {
        if (!hasAnyChannel()) {
            setPreviewUrl("");
            return;
        }
        const basePath = getChatBasePath();
        if (!basePath) {
            setPreviewUrl("");
            return;
        }
        const params = buildParams();
        const query = params.toString();
        setPreviewUrl(query ? `${basePath}?${query}` : basePath);
    });

    const generateUrl = () => {
        if (!hasAnyChannel()) return "";
        const basePath = getChatBasePath();
        if (!basePath) return "";
        const base = `${typeof window !== 'undefined' ? window.location.origin : ''}${basePath}`;
        const url = new URL(base);
        const params = buildParams();
        params.forEach((value, key) => url.searchParams.set(key, value));
        return url.toString();
    };

    const handleCopy = async () => {
        const url = generateUrl();
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const handleOpen = () => {
        const url = generateUrl();
        if (url) window.open(url, '_blank');
    };

    return (
        <div class="min-h-screen bg-black text-slate-100">
            <MySiteTitle>Kroma - Setup</MySiteTitle>
            <div class="relative overflow-hidden">
                <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.08),_transparent_45%),radial-gradient(circle_at_30%_60%,_rgba(245,158,11,0.08),_transparent_40%)]" />
                <div class="relative">
                    <header class="sticky top-0 z-20 border-b border-slate-900 bg-black/70 backdrop-blur">
                        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="h-10 w-10 overflow-hidden rounded-md bg-slate-900">
                                    <img src="/kroma-logo.png" alt="Kroma" class="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <h1 class="text-lg font-semibold">Kroma</h1>
                                    <p class="text-xs text-slate-400">Inclusive Chat Overlay</p>
                                </div>
                            </div>
                            <a
                                href="https://github.com/scaptiq/kroma"
                                target="_blank"
                                class="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
                            >
                                <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                                    <path d="M12 .5C5.65.5.5 5.78.5 12.3c0 5.23 3.44 9.66 8.2 11.23.6.12.82-.27.82-.6 0-.3-.02-1.27-.02-2.3-3 .56-3.78-.74-4.02-1.42-.13-.35-.7-1.42-1.2-1.7-.41-.23-.98-.8-.02-.82.9-.02 1.55.86 1.77 1.22 1.03 1.77 2.67 1.27 3.32.97.1-.76.4-1.27.72-1.56-2.66-.3-5.45-1.38-5.45-6.1 0-1.35.46-2.46 1.2-3.32-.12-.3-.52-1.55.1-3.23 0 0 1-.33 3.32 1.27.96-.28 2-.42 3.03-.42 1.03 0 2.07.14 3.03.42 2.32-1.62 3.32-1.27 3.32-1.27.62 1.68.22 2.93.1 3.23.75.86 1.2 1.96 1.2 3.32 0 4.74-2.8 5.8-5.47 6.1.41.37.77 1.08.77 2.2 0 1.6-.02 2.9-.02 3.3 0 .33.22.73.82.6 4.76-1.57 8.2-6 8.2-11.23C23.5 5.78 18.35.5 12 .5Z" />
                                </svg>
                                GitHub
                            </a>
                        </div>
                    </header>

                    <main class="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[360px_1fr]">
                        <section class="space-y-6">
                            <div class="rounded-lg border border-slate-900 bg-black/60 px-4 py-3 text-sm text-slate-300">
                                <span class="font-semibold text-white">Hello there!</span> Let’s get your chat overlay dialed in.
                            </div>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Setup</CardTitle>
                                    <CardDescription>Pick a platform and channel to get started.</CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <div class="grid grid-cols-2 gap-2">
                                        <For each={[
                                            { id: 'twitch', label: 'Twitch', active: '!bg-purple-600 !text-white hover:!bg-purple-500 border-purple-500/80' },
                                            { id: 'kick', label: 'Kick', active: '!bg-emerald-600 !text-white hover:!bg-emerald-500 border-emerald-500/80' },
                                            { id: 'youtube', label: 'YouTube', active: '!bg-red-600 !text-white hover:!bg-red-500 border-red-500/80' },
                                            { id: 'velora', label: 'Velora', active: '!bg-amber-400 !text-black hover:!bg-amber-300 border-amber-300' },
                                            { id: 'combined', label: 'Multichat', active: '!bg-slate-200 !text-black hover:!bg-white border-slate-200' }
                                        ]}>
                                            {(tab) => (
                                                <Button
                                                    variant="secondary"
                                                    class={`w-full ${platformTab() === tab.id ? tab.active : ''}`}
                                                    onClick={() => setPlatformTab(tab.id as PlatformTab)}
                                                >
                                                    {tab.label}
                                                </Button>
                                            )}
                                        </For>
                                    </div>

                                    <Show when={platformTab() !== 'combined'}>
                                        {(() => {
                                            const current = platformTab() as ChatPlatform;
                                            return (
                                                <div class="space-y-2">
                                                    <Label>Channel</Label>
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs text-slate-500">{getChannelPrefix(current)}</span>
                                                        <Input
                                                            placeholder={getChannelPlaceholder(current)}
                                                            value={getChannelForPlatform(current)}
                                                            onInput={(e) => setChannelForPlatform(current, sanitizeChannel(e.currentTarget.value, current))}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </Show>

                                    <Show when={platformTab() === 'combined'}>
                                        <div class="space-y-3">
                                            <div class="rounded-md border border-slate-900 bg-black/50 px-3 py-2 text-xs text-slate-400">
                                                Combine multiple platforms into one overlay. Toggle the platforms you want, then add the channel for each.
                                            </div>
                                            <For each={[
                                                { id: 'twitch', label: 'Twitch', color: 'text-purple-300', prefix: 'twitch.tv/' },
                                                { id: 'kick', label: 'Kick', color: 'text-emerald-300', prefix: 'kick.com/' },
                                                { id: 'youtube', label: 'YouTube', color: 'text-red-300', prefix: 'youtube.com/@' },
                                                { id: 'velora', label: 'Velora', color: 'text-amber-300', prefix: 'velora.tv/' },
                                            ]}>
                                                {(entry) => {
                                                    const enabled = () => combinedPlatforms().includes(entry.id as ChatPlatform);
                                                    return (
                                                        <div class="rounded-md border border-slate-800 p-3">
                                                            <div class="flex items-center justify-between">
                                                                <div class="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={enabled()}
                                                                        onChange={() => toggleCombinedPlatform(entry.id as ChatPlatform)}
                                                                        class="h-4 w-4 accent-cyan-400"
                                                                    />
                                                                    <span class={"text-sm font-semibold " + entry.color}>{entry.label}</span>
                                                                </div>
                                                                <span class="text-xs text-slate-500">{entry.prefix}</span>
                                                            </div>
                                                            <div class="mt-2">
                                                                <Input
                                                                    placeholder={`${entry.label.toLowerCase()}_username`}
                                                                    value={getChannelForPlatform(entry.id as ChatPlatform)}
                                                                    onInput={(e) => setChannelForPlatform(entry.id as ChatPlatform, sanitizeChannel(e.currentTarget.value, entry.id as ChatPlatform))}
                                                                    disabled={!enabled()}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                }}
                                            </For>
                                        </div>
                                    </Show>
                                </CardContent>
                            </Card>

                            <div class="space-y-4">
                                <div class="inline-flex flex-wrap gap-2 rounded-lg border border-slate-900 bg-black/60 p-1">
                                    {[
                                        { label: 'Core', index: 0 },
                                        { label: 'Visuals', index: 1 },
                                        { label: 'Safety', index: 2 },
                                    ].map((tab) => (
                                        <button
                                            class={`rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${activeTab() === tab.index ? 'bg-white text-black' : 'text-slate-400 hover:bg-slate-900/60 hover:text-white'}`}
                                            onClick={() => setActiveTab(tab.index)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <Show when={activeTab() === 0}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Chat Basics</CardTitle>
                                            <CardDescription>Core overlay behavior across platforms.</CardDescription>
                                        </CardHeader>
                                        <CardContent class="space-y-3">
                                            <div class="flex items-center justify-between">
                                                <Label>Platform Badge</Label>
                                                <Switch checked={showPlatformBadge()} onChange={setShowPlatformBadge} />
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <Label>Timestamps</Label>
                                                <Switch checked={showTimestamps()} onChange={setShowTimestamps} />
                                            </div>
                                            <Show when={hasPlatform('twitch')}>
                                                <div class="flex items-center justify-between">
                                                    <Label>Shared Chat</Label>
                                                    <Switch checked={showSharedChat()} onChange={setShowSharedChat} />
                                                </div>
                                                <div class="flex items-center justify-between">
                                                    <Label>Replies</Label>
                                                    <Switch checked={showReplies()} onChange={setShowReplies} />
                                                </div>
                                                <div class="rounded-md border border-slate-800 p-3">
                                                    <div class="flex items-center justify-between">
                                                        <Label>Pronouns</Label>
                                                        <Switch checked={showPronouns()} onChange={setShowPronouns} />
                                                    </div>
                                                    <Show when={showPronouns()}>
                                                        <div class="mt-2 flex items-center justify-between">
                                                            <Label>Pride Mode</Label>
                                                            <Switch checked={pridePronouns()} onChange={setPridePronouns} />
                                                        </div>
                                                    </Show>
                                                </div>
                                            </Show>
                                        </CardContent>
                                    </Card>
                                </Show>

                                <Show when={activeTab() === 1}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Visual Style</CardTitle>
                                            <CardDescription>Fonts, emotes, and overlay visuals.</CardDescription>
                                        </CardHeader>
                                        <CardContent class="space-y-4">
                                            <div>
                                                <div class="flex items-center justify-between text-sm text-slate-400">
                                                    <span>Font Size</span>
                                                    <span class="text-slate-200">{fontSize()}px</span>
                                                </div>
                                                <GradientSlider min={12} max={48} value={fontSize()} onChange={setFontSize} />
                                            </div>

                                            <div class="space-y-2">
                                                <div class="flex items-center justify-between">
                                                    <Label>Custom Font</Label>
                                                    <Switch checked={useCustomFont()} onChange={setUseCustomFont} />
                                                </div>
                                                <Show when={useCustomFont()}>
                                                    <Input
                                                        placeholder="Font Family Name"
                                                        value={customFont()}
                                                        onInput={(e) => setCustomFont(e.currentTarget.value)}
                                                    />
                                                </Show>
                                                <Show when={!useCustomFont()}>
                                                    <select
                                                        value={selectedFont()}
                                                        onChange={(e) => setSelectedFont(e.currentTarget.value)}
                                                        class="w-full rounded-md border border-slate-800 bg-black/60 px-3 py-2 text-sm text-slate-100"
                                                    >
                                                        <For each={PRESET_FONTS}>{(f) => <option value={f.value}>{f.name}</option>}</For>
                                                    </select>
                                                </Show>
                                            </div>

                                            <div class="grid grid-cols-2 gap-3">
                                                <Show when={anySupportsHighlights()}>
                                                    <div class="flex items-center justify-between">
                                                        <Label>{highlightLabel()}</Label>
                                                        <Switch checked={showHighlights()} onChange={setShowHighlights} />
                                                    </div>
                                                </Show>
                                                <Show when={anySupportsBadges()}>
                                                    <div class="flex items-center justify-between">
                                                        <Label>Subscriber Badges</Label>
                                                        <Switch checked={showBadges()} onChange={setShowBadges} />
                                                    </div>
                                                </Show>
                                                <Show when={anySupportsNamePaints()}>
                                                    <div class="flex items-center justify-between">
                                                        <Label>Name Paints</Label>
                                                        <Switch checked={showNamePaints()} onChange={setShowNamePaints} />
                                                    </div>
                                                </Show>
                                                <Show when={anySupportsRoomState()}>
                                                    <div class="flex items-center justify-between">
                                                        <Label>Room State</Label>
                                                        <Switch checked={showRoomState()} onChange={setShowRoomState} />
                                                    </div>
                                                </Show>
                                                <div class="flex items-center justify-between">
                                                    <Label>Emotes</Label>
                                                    <Switch checked={showEmotes()} onChange={setShowEmotes} />
                                                </div>
                                            </div>

                                            <Show when={showEmotes()}>
                                                <div>
                                                    <div class="flex items-center justify-between text-sm text-slate-400">
                                                        <span>Emote Scale</span>
                                                        <span class="text-slate-200">{emoteScale().toFixed(1)}x</span>
                                                    </div>
                                                    <GradientSlider min={0.5} max={4.0} step={0.1} value={emoteScale()} onChange={setEmoteScale} />
                                                </div>
                                            </Show>

                                            <div class="border-t border-slate-900 pt-4">
                                                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Background</div>
                                                <div class="mt-3 space-y-3">
                                                    <div class="space-y-2">
                                                        <Label>Page Background</Label>
                                                        <select
                                                            value={pageBackground()}
                                                            onChange={(e) => setPageBackground(e.currentTarget.value as 'transparent' | 'dim' | 'dark')}
                                                            class="w-full rounded-md border border-slate-800 bg-black/60 px-3 py-2 text-sm text-slate-100"
                                                        >
                                                            <option value="transparent">Transparent</option>
                                                            <option value="dim">Dim</option>
                                                            <option value="dark">Dark</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <div class="flex items-center justify-between text-sm text-slate-400">
                                                            <span>Message Background</span>
                                                            <span class="text-slate-200">{Math.round(messageBgOpacity() * 100)}%</span>
                                                        </div>
                                                        <GradientSlider
                                                            min={0}
                                                            max={0.9}
                                                            step={0.05}
                                                            value={messageBgOpacity()}
                                                            onChange={(value) => setMessageBgOpacity(Number(value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="border-t border-slate-900 pt-4">
                                                <div class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Text</div>
                                                <div class="mt-3 flex items-center gap-3">
                                                    <input
                                                        type="color"
                                                        value={textColor()}
                                                        onInput={(e) => setTextColor(e.currentTarget.value)}
                                                        class="h-10 w-12 rounded-md border border-slate-800 bg-black/60"
                                                    />
                                                    <Input
                                                        value={textColor()}
                                                        onInput={(e) => setTextColor(e.currentTarget.value)}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Show>

                                <Show when={activeTab() === 2}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Safety & Clutter</CardTitle>
                                            <CardDescription>Keep the overlay readable.</CardDescription>
                                        </CardHeader>
                                        <CardContent class="space-y-4">
                                            <div class="flex items-center justify-between">
                                                <Label>Fade Out Messages</Label>
                                                <Switch checked={fadeOutMessages()} onChange={setFadeOutMessages} />
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <Label>Message Sound</Label>
                                                <Switch checked={playSound()} onChange={setPlaySound} />
                                            </div>
                                            <Show when={fadeOutMessages()}>
                                                <div>
                                                    <div class="flex items-center justify-between text-sm text-slate-400">
                                                        <span>Disappear after</span>
                                                        <span class="text-slate-200">{fadeOutDelay()}s</span>
                                                    </div>
                                                    <GradientSlider min={5} max={120} step={5} value={fadeOutDelay()} onChange={setFadeOutDelay} />
                                                </div>
                                            </Show>
                                            <div>
                                                <div class="flex items-center justify-between text-sm text-slate-400">
                                                    <span>Max Messages</span>
                                                    <span class="text-slate-200">{maxMessages()}</span>
                                                </div>
                                                <GradientSlider min={5} max={100} value={maxMessages()} onChange={setMaxMessages} />
                                            </div>
                                            <div class="space-y-2">
                                                <Input
                                                    placeholder="Block Users (comma separated)"
                                                    value={blockedUsers()}
                                                    onInput={(e) => setBlockedUsers(e.currentTarget.value)}
                                                />
                                                <Input
                                                    placeholder="Hide Custom Bots (comma separated)"
                                                    value={customBots()}
                                                    onInput={(e) => setCustomBots(e.currentTarget.value)}
                                                />
                                                <div class="flex items-center justify-between">
                                                    <Label>Hide !commands</Label>
                                                    <Switch checked={hideCommands()} onChange={setHideCommands} />
                                                </div>
                                                <div class="flex items-center justify-between">
                                                    <Label>Hide Common Bots</Label>
                                                    <Switch checked={hideBots()} onChange={setHideBots} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Show>
                            </div>
                        </section>

                        <section class="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Streaming Software</CardTitle>
                                    <CardDescription>Select your target to see recommended settings.</CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-4">
                                    <div class="grid grid-cols-2 gap-2">
                                        <button
                                            class={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition ${streamTarget() === 'obs' ? 'border-white bg-white text-black' : 'border-slate-800 bg-black/60 text-slate-200 hover:border-slate-600'}`}
                                            onClick={() => setStreamTarget('obs')}
                                        >
                                            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
                                                <img
                                                    src="https://upload.wikimedia.org/wikipedia/commons/d/d3/OBS_Studio_Logo.svg"
                                                    alt="OBS Studio"
                                                    class="h-5 w-5 object-contain"
                                                />
                                            </span>
                                            OBS
                                        </button>
                                        <button
                                            class={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-medium transition ${streamTarget() === 'meld' ? 'border-white bg-white text-black' : 'border-slate-800 bg-black/60 text-slate-200 hover:border-slate-600'}`}
                                            onClick={() => setStreamTarget('meld')}
                                        >
                                            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900">
                                                <img
                                                    src="https://meldstudio.co/blog/content/images/size/w250/format/webp/2024/11/4e9535e91c08fb5377cd87ed7268f4b8.webp"
                                                    alt="Meld Studio"
                                                    class="h-6 w-6 object-contain"
                                                />
                                            </span>
                                            Meld Studio
                                        </button>
                                    </div>
                                    <Show when={streamTarget() === 'obs'}>
                                        <div class="space-y-2 text-sm text-slate-300">
                                            <div class="flex items-center justify-between">
                                                <span>Recommended size</span>
                                                <span class="text-slate-100">450 × 800</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span>Font size</span>
                                                <span class="text-slate-100">16–20px</span>
                                            </div>
                                        </div>
                                    </Show>
                                    <Show when={streamTarget() === 'meld'}>
                                        <div class="space-y-2 text-sm text-slate-300">
                                            <div class="rounded-md border border-slate-800 bg-black/50 px-3 py-2 text-xs text-slate-400">
                                                Tip: set Page Background to “Dim” and Message Background to ~10% for readability.
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span>Recommended size</span>
                                                <span class="text-slate-100">1080 × 1920</span>
                                            </div>
                                            <div class="flex items-center justify-between">
                                                <span>Font size</span>
                                                <span class="text-slate-100">20–24px</span>
                                            </div>
                                        </div>
                                    </Show>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Overlay URL</CardTitle>
                                    <CardDescription>Copy or open the overlay link.</CardDescription>
                                </CardHeader>
                                <CardContent class="space-y-3">
                                    <div class="rounded-md border border-slate-800 bg-black/60 p-3 text-xs text-cyan-300">
                                        {generateUrl()}
                                    </div>
                                    <div class="grid grid-cols-2 gap-2">
                                        <Button onClick={handleCopy}>{copied() ? 'Copied' : 'Copy URL'}</Button>
                                        <Button variant="outline" onClick={handleOpen}>Open</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div class="h-px bg-slate-900/80" />
                            <Card>
                                <CardHeader>
                                    <CardTitle>Live Preview</CardTitle>
                                    <CardDescription>See your overlay changes instantly.</CardDescription>
                                </CardHeader>
                                <CardContent class="h-[560px] p-0">
                                    <Show when={previewUrl()} fallback={
                                        <div class="flex h-full items-center justify-center text-sm text-slate-500">
                                            Enter a channel to preview
                                        </div>
                                    }>
                                        <iframe
                                            src={previewUrl()}
                                            class="h-full w-full rounded-b-lg"
                                            style={{ border: 'none', background: 'transparent' }}
                                            allow="autoplay"
                                        />
                                    </Show>
                                </CardContent>
                            </Card>
                        </section>
                    </main>

                    <footer class="mx-auto max-w-6xl px-6 pb-10 text-xs text-slate-500">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-slate-900 pt-4">
                            <span>
                                Created by <a class="text-slate-300 hover:text-white" href="https://github.com/scaptiq" target="_blank">scaptiq</a>.
                            </span>
                            <span>
                                Inspired by <a class="text-slate-300 hover:text-white" href="https://github.com/IS2511/ChatIS" target="_blank">ChatIS</a> by IS2511. Licensed MIT.
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

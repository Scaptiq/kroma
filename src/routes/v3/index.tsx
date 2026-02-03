import { createSignal, Show, For, createEffect } from "solid-js";
import { useLocation, useNavigate } from "solid-start";
import {
    Box,
    Card,
    CardContent,
    Checkbox,
    Container,
    createTheme,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    Paper,
    Stack,
    TextField,
    ThemeProvider,
    Typography,
    Switch,
    Button,
    Alert
} from "@suid/material";


import ContentCopyIcon from "@suid/icons-material/ContentCopy";
import OpenInNewIcon from "@suid/icons-material/OpenInNew";
import CheckCircleIcon from "@suid/icons-material/CheckCircle";
import SettingsIcon from "@suid/icons-material/Settings";
import VisibilityIcon from "@suid/icons-material/Visibility";
import DragIndicatorIcon from "@suid/icons-material/DragIndicator";
import InfoIcon from "@suid/icons-material/Info";
import TextFieldsIcon from "@suid/icons-material/TextFields";

import MySiteTitle from "~/components/MySiteTitle";
import GradientSlider from "~/components/GradientSlider";

// Preset fonts that users can choose from
const PRESET_FONTS = [
    { name: 'Segoe UI', value: 'Segoe UI' },
    { name: 'Inter', value: 'Inter' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Comic Neue', value: 'Comic Neue' },
    { name: 'Comfortaa', value: 'Comfortaa' },
    { name: 'Ubuntu', value: 'Ubuntu' },
];

export default function ChatSetup() {
    const location = useLocation();
    const navigate = useNavigate();

    createEffect(() => {
        if (location.pathname.startsWith('/v3')) {
            navigate(`/setup${location.search}`, { replace: true });
        }
    });
    const theme = createTheme({
        palette: {
            mode: 'dark',
            primary: { main: '#F472B6' }, // Pink 400
            secondary: { main: '#2DD4BF' }, // Teal 400
            background: {
                default: 'transparent',
                paper: 'rgba(255, 255, 255, 0.05)',
            },
            text: {
                primary: '#fff',
                secondary: 'rgba(255, 255, 255, 0.7)',
            }
        },
        typography: {
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            button: { fontWeight: 600, textTransform: 'none', borderRadius: 12 },
            h5: { fontWeight: 800 },
            h6: { fontWeight: 700 }
        },
        shape: { borderRadius: 16 }
    });

    // Form state
    type Platform = 'twitch' | 'kick' | 'youtube';
    type PlatformTab = Platform | 'combined';
    const [platformTab, setPlatformTab] = createSignal<PlatformTab>('twitch');
    const [combinedPlatforms, setCombinedPlatforms] = createSignal<Platform[]>(['twitch']);
    const [twitchChannel, setTwitchChannel] = createSignal("");
    const [kickChannel, setKickChannel] = createSignal("");
    const [youtubeChannel, setYoutubeChannel] = createSignal("");
    const [showPronouns, setShowPronouns] = createSignal(true);
    const [showPlatformBadge, setShowPlatformBadge] = createSignal(true);
    const [showBadges, setShowBadges] = createSignal(true);
    const [showEmotes, setShowEmotes] = createSignal(true);
    const [showTimestamps, setShowTimestamps] = createSignal(false);
    const [showSharedChat, setShowSharedChat] = createSignal(true);
    const [showNamePaints, setShowNamePaints] = createSignal(true);
    const [showRoomState, setShowRoomState] = createSignal(false);
    const [showReplies, setShowReplies] = createSignal(true);
    const [hideCommands, setHideCommands] = createSignal(false);
    const [hideBots, setHideBots] = createSignal(false);
    const [maxMessages, setMaxMessages] = createSignal(50);
    const [fontSize, setFontSize] = createSignal(16);
    const [emoteScale, setEmoteScale] = createSignal(1.0);
    const [fadeOutMessages, setFadeOutMessages] = createSignal(false);
    const [fadeOutDelay, setFadeOutDelay] = createSignal(30);
    const [blockedUsers, setBlockedUsers] = createSignal("");
    const [customBots, setCustomBots] = createSignal("");
    const [selectedFont, setSelectedFont] = createSignal('Segoe UI');
    const [customFont, setCustomFont] = createSignal('');
    const [useCustomFont, setUseCustomFont] = createSignal(false);
    const [pridePronouns, setPridePronouns] = createSignal(false);

    const [copied, setCopied] = createSignal(false);
    const [previewUrl, setPreviewUrl] = createSignal("");
    const [activeTab, setActiveTab] = createSignal(0);

    // Get the effective font to use
    const getEffectiveFont = () => {
        if (useCustomFont() && customFont().trim()) {
            return customFont().trim();
        }
        return selectedFont();
    };

    const selectedPlatforms = () => platformTab() === 'combined' ? combinedPlatforms() : [platformTab() as Platform];
    const sectionPlatforms = () => platformTab() === 'combined' ? combinedPlatforms() : [platformTab() as Platform];

    const toggleCombinedPlatform = (value: Platform) => {
        setCombinedPlatforms(prev => {
            if (prev.includes(value)) {
                const next = prev.filter(p => p !== value);
                return next.length > 0 ? next : ['twitch'];
            }
            return [...prev, value];
        });
    };

    const hasPlatform = (value: Platform) => selectedPlatforms().includes(value);

    const getChannelForPlatform = (value: Platform) => {
        switch (value) {
            case 'kick':
                return kickChannel();
            case 'youtube':
                return youtubeChannel();
            default:
                return twitchChannel();
        }
    };

    const setChannelForPlatform = (value: Platform, channelValue: string) => {
        switch (value) {
            case 'kick':
                setKickChannel(channelValue);
                break;
            case 'youtube':
                setYoutubeChannel(channelValue);
                break;
            default:
                setTwitchChannel(channelValue);
        }
    };

    const sanitizeChannel = (value: string, platform: Platform) => {
        if (platform === 'youtube') {
            return value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
        }
        return value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    };

    const getChannelPlaceholder = (platform: Platform) => {
        if (platform === 'kick') return "kick_username";
        if (platform === 'youtube') return "youtube_handle";
        return "twitch_username";
    };

    const getChannelPrefix = (platform: Platform) => {
        if (platform === 'kick') return "kick.com/";
        if (platform === 'youtube') return "youtube.com/@";
        return "twitch.tv/";
    };

    const getPrimaryChannel = () => {
        for (const platform of selectedPlatforms()) {
            const channelValue = getChannelForPlatform(platform);
            if (channelValue) return channelValue;
        }
        return "";
    };

    const renderPlatformLabel = (platform: Platform) => {
        if (platform === 'kick') return 'Kick';
        if (platform === 'youtube') return 'YouTube';
        return 'Twitch';
    };

    // Update preview URL when settings change
    createEffect(() => {
        const params = new URLSearchParams();
        const selected = selectedPlatforms();
        const hasTwitch = selected.includes('twitch');
        const primaryChannel = getPrimaryChannel();

        if (!primaryChannel) {
            setPreviewUrl("");
            return;
        }

        params.set('platforms', selected.join(','));
        if (hasPlatform('twitch') && twitchChannel()) params.set('twitch', twitchChannel());
        if (hasPlatform('kick') && kickChannel()) params.set('kick', kickChannel());
        if (hasPlatform('youtube') && youtubeChannel()) params.set('youtube', youtubeChannel());
        if (!showPlatformBadge()) params.set('platformBadge', 'false');
        if (hasTwitch) {
            if (!showPronouns()) params.set('pronouns', 'false');
        }
        if (!showBadges()) params.set('badges', 'false');
        if (!showEmotes()) params.set('emotes', 'false');
        if (showTimestamps()) params.set('timestamps', 'true');
        if (hasTwitch) {
            if (!showSharedChat()) params.set('shared', 'false');
            if (showRoomState()) params.set('roomState', 'true');
            if (!showReplies()) params.set('replies', 'false');
        }
        if (!showNamePaints()) params.set('paints', 'false');
        if (hideCommands()) params.set('hideCommands', 'true');
        if (hideBots()) params.set('hideBots', 'true');
        if (maxMessages() !== 50) params.set('maxMessages', String(maxMessages()));
        const font = getEffectiveFont();
        if (font !== 'Segoe UI') params.set('font', font);
        if (fontSize() !== 16) params.set('fontSize', String(fontSize()));
        if (emoteScale() !== 1.0) params.set('emoteScale', String(emoteScale()));
        if (fadeOutMessages()) {
            params.set('fadeOut', 'true');
            if (fadeOutDelay() !== 30) params.set('fadeDelay', String(fadeOutDelay() * 1000));
        }
        if (blockedUsers().trim()) params.set('blocked', blockedUsers().trim());
        if (customBots().trim()) params.set('bots', customBots().trim());
        if (pridePronouns()) params.set('pridePronouns', 'true');

        const queryString = params.toString();
        setPreviewUrl(`/chat/${primaryChannel}?${queryString}`);
    });

    const generateUrl = () => {
        const primaryChannel = getPrimaryChannel();
        if (!primaryChannel) return "";
        const base = `${typeof window !== 'undefined' ? window.location.origin : ''}/chat/${primaryChannel}`;
        // We can reuse the search params logic but it's bound to the effect.
        // Replicating simple string generation for the input box:
        const url = new URL(base);
        const selected = selectedPlatforms();
        const hasTwitch = selected.includes('twitch');
        url.searchParams.set('platforms', selected.join(','));
        if (hasPlatform('twitch') && twitchChannel()) url.searchParams.set('twitch', twitchChannel());
        if (hasPlatform('kick') && kickChannel()) url.searchParams.set('kick', kickChannel());
        if (hasPlatform('youtube') && youtubeChannel()) url.searchParams.set('youtube', youtubeChannel());
        if (!showPlatformBadge()) url.searchParams.set('platformBadge', 'false');
        if (hasTwitch) {
            if (!showPronouns()) url.searchParams.set('pronouns', 'false');
        }
        if (!showBadges()) url.searchParams.set('badges', 'false');
        if (!showEmotes()) url.searchParams.set('emotes', 'false');
        if (showTimestamps()) url.searchParams.set('timestamps', 'true');
        if (hasTwitch) {
            if (!showSharedChat()) url.searchParams.set('shared', 'false');
            if (showRoomState()) url.searchParams.set('roomState', 'true');
            if (!showReplies()) url.searchParams.set('replies', 'false');
        }
        if (!showNamePaints()) url.searchParams.set('paints', 'false');
        if (hideCommands()) url.searchParams.set('hideCommands', 'true');
        if (hideBots()) url.searchParams.set('hideBots', 'true');
        if (maxMessages() !== 50) url.searchParams.set('maxMessages', String(maxMessages()));
        if (fontSize() !== 16) url.searchParams.set('fontSize', String(fontSize()));
        if (emoteScale() !== 1.0) url.searchParams.set('emoteScale', String(emoteScale()));
        if (fadeOutMessages()) {
            url.searchParams.set('fadeOut', 'true');
            if (fadeOutDelay() !== 30) url.searchParams.set('fadeDelay', String(fadeOutDelay() * 1000));
        }
        if (blockedUsers().trim()) url.searchParams.set('blocked', blockedUsers().trim());
        if (customBots().trim()) url.searchParams.set('bots', customBots().trim());
        const font = getEffectiveFont();
        if (font !== 'Segoe UI') url.searchParams.set('font', font);

        return url.toString();
    };



    const handleCopy = async () => {
        const url = generateUrl();
        if (url) {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleOpen = () => {
        const url = generateUrl();
        if (url) window.open(url, '_blank');
    };

    const activeTabStyle = {
        background: 'rgba(255, 255, 255, 0.15)',
        color: '#fff',
        fontWeight: 600
    };

    const inactiveTabStyle = {
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: 500
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: 2,
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused fieldset': { borderColor: '#F472B6' }
        }
    };

    return (
        <>
            <MySiteTitle>Kroma - Setup</MySiteTitle>
            <ThemeProvider theme={theme}>
                <style>{`
                    /* Dreamy Background Animation */
                    @keyframes float {
                        0% { transform: translate(0px, 0px) scale(1); }
                        33% { transform: translate(30px, -50px) scale(1.1); }
                        66% { transform: translate(-20px, 20px) scale(0.9); }
                        100% { transform: translate(0px, 0px) scale(1); }
                    }

                    .aurora-blob {
                        position: absolute;
                        filter: blur(80px);
                        opacity: 0.4;
                        animation: float 10s ease-in-out infinite;
                        z-index: 0;
                        border-radius: 50%;
                    }

                    /* Custom Scrollbar for the preview */
                    ::-webkit-scrollbar { width: 8px; height: 8px; }
                    ::-webkit-scrollbar-track { background: transparent; }
                    ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }

                    /* Premium Slider */


                    /* Glassmorphism Panel */
                    .glass-panel {
                        background: rgba(255, 255, 255, 0.03) !important;
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.08) !important;
                        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
                        transition: transform 0.3s, border-color 0.3s;
                    }
                    .glass-panel:hover {
                        border-color: rgba(255, 255, 255, 0.15) !important;
                    }
                `}</style>

                {/* Background Layers */}
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#0f0c29', zIndex: -2, background: 'linear-gradient(to bottom right, #1a1b4b, #2e1065, #0f172a)' }} />
                <Box class="aurora-blob" sx={{ top: '10%', left: '10%', width: '40vw', height: '40vw', background: '#4c1d95', animationDelay: '0s' }} />
                <Box class="aurora-blob" sx={{ top: '40%', right: '10%', width: '35vw', height: '35vw', background: '#be185d', animationDelay: '-2s' }} />
                <Box class="aurora-blob" sx={{ bottom: '10%', left: '20%', width: '30vw', height: '30vw', background: '#0e7490', animationDelay: '-4s' }} />

                <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

                    {/* Navbar */}
                    <Box sx={{
                        py: 2,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(15, 23, 42, 0.3)',
                        backdropFilter: 'blur(20px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100
                    }}>
                        <Container maxWidth="xl">
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{
                                        width: 44, height: 44,
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        boxShadow: '0 0 20px rgba(192, 132, 252, 0.4)'
                                    }}>
                                        <img src="/kroma-logo.png" style={{ width: '100%', height: '100%', "object-fit": 'cover' }} alt="Kroma Logo" />
                                    </Box>
                                    <Box>
                                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            Kroma
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                            Inclusive Chat Overlay
                                        </Typography>
                                    </Box>
                                </Stack>
                                <a href="https://github.com/scaptiq/kroma" target="_blank" style={{ "text-decoration": 'none', display: 'flex' }}>
                                    <IconButton sx={{ color: 'white', '&:hover': { background: 'rgba(255,255,255,0.1)' } }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.616-4.033-1.616-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </IconButton>
                                </a>
                            </Stack>
                        </Container>
                    </Box>

                    <Container maxWidth="xl" sx={{ flex: 1, py: 5 }}>
                        <Grid container spacing={4} sx={{ height: '100%' }}>

                            {/* Settings Column */}
                            <Grid item xs={12} lg={4}>
                                <Stack spacing={3}>

                                    {/* Welcome / Setup */}
                                    <Paper class="glass-panel" sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
                                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #F472B6, #C084FC, #2DD4BF)' }} />
                                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Hello there! 👋</Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                                            Welcome to Kroma. Choose a platform and enter your channel below to get started.
                                        </Typography>
                                        <Paper class="glass-panel" sx={{ p: 0.75, mb: 2, display: 'flex', borderRadius: 3 }}>
                                            <For each={[
                                                { id: 'twitch', label: 'Twitch' },
                                                { id: 'kick', label: 'Kick' },
                                                { id: 'youtube', label: 'YouTube' },
                                                { id: 'combined', label: 'Combined' }
                                            ]}>
                                                {(tab) => (
                                                    <Button
                                                        fullWidth
                                                        onClick={() => setPlatformTab(tab.id as PlatformTab)}
                                                        sx={{
                                                            py: 1.1,
                                                            borderRadius: 2.5,
                                                            transition: 'all 0.3s',
                                                            ...(platformTab() === tab.id
                                                                ? {
                                                                    ...(tab.id === 'twitch'
                                                                        ? { background: 'linear-gradient(135deg, #9147ff, #5b1fd6)', color: '#fff' }
                                                                        : tab.id === 'kick'
                                                                            ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', color: '#fff' }
                                                                            : tab.id === 'youtube'
                                                                                ? { background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff' }
                                                                                : { background: 'linear-gradient(135deg, #f97316, #ec4899, #8b5cf6, #22d3ee)', color: '#fff' })
                                                                }
                                                                : inactiveTabStyle)
                                                        }}
                                                    >
                                                        {tab.label}
                                                    </Button>
                                                )}
                                            </For>
                                        </Paper>

                                        <Show when={platformTab() !== 'combined'}>
                                            {(() => {
                                                const current = platformTab() as Platform;
                                                return (
                                                    <>
                                                        <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                                                            Single mode connects to the selected platform.
                                                        </Typography>
                                                        <TextField
                                                            fullWidth
                                                            variant="outlined"
                                                            placeholder={getChannelPlaceholder(current)}
                                                            value={getChannelForPlatform(current)}
                                                            onChange={(e) => setChannelForPlatform(current, sanitizeChannel(e.target.value, current))}
                                                            sx={inputSx}
                                                            InputProps={{
                                                                startAdornment: (
                                                                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontWeight: 600 }}>
                                                                        {getChannelPrefix(current)}
                                                                    </Typography>
                                                                )
                                                            }}
                                                        />
                                                    </>
                                                );
                                            })()}
                                        </Show>

                                        <Show when={platformTab() === 'combined'}>
                                            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                                                Combined mode connects to all selected platforms with their own usernames.
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2, display: 'block' }}>
                                                Toggle platforms and add the usernames you want to merge.
                                            </Typography>

                                            <Stack spacing={2.5}>
                                                <Paper class="glass-panel" sx={{ p: 2, borderRadius: 3, border: combinedPlatforms().includes('twitch') ? '1px solid rgba(145,71,255,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#c4b5fd' }}>Twitch</Typography>
                                                        <Checkbox checked={combinedPlatforms().includes('twitch')} onChange={() => toggleCombinedPlatform('twitch')} />
                                                    </Stack>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        placeholder="twitch_username"
                                                        value={twitchChannel()}
                                                        onChange={(e) => setTwitchChannel(sanitizeChannel(e.target.value, 'twitch'))}
                                                        sx={inputSx}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontWeight: 600 }}>
                                                                    twitch.tv/
                                                                </Typography>
                                                            )
                                                        }}
                                                    />
                                                </Paper>

                                                <Paper class="glass-panel" sx={{ p: 2, borderRadius: 3, border: combinedPlatforms().includes('kick') ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#86efac' }}>Kick</Typography>
                                                        <Checkbox checked={combinedPlatforms().includes('kick')} onChange={() => toggleCombinedPlatform('kick')} />
                                                    </Stack>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        placeholder="kick_username"
                                                        value={kickChannel()}
                                                        onChange={(e) => setKickChannel(sanitizeChannel(e.target.value, 'kick'))}
                                                        sx={inputSx}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontWeight: 600 }}>
                                                                    kick.com/
                                                                </Typography>
                                                            )
                                                        }}
                                                    />
                                                </Paper>

                                                <Paper class="glass-panel" sx={{ p: 2, borderRadius: 3, border: combinedPlatforms().includes('youtube') ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: '#fca5a5' }}>YouTube</Typography>
                                                        <Checkbox checked={combinedPlatforms().includes('youtube')} onChange={() => toggleCombinedPlatform('youtube')} />
                                                    </Stack>
                                                    <TextField
                                                        fullWidth
                                                        variant="outlined"
                                                        placeholder="youtube_handle"
                                                        value={youtubeChannel()}
                                                        onChange={(e) => setYoutubeChannel(sanitizeChannel(e.target.value, 'youtube'))}
                                                        sx={inputSx}
                                                        InputProps={{
                                                            startAdornment: (
                                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontWeight: 600 }}>
                                                                    youtube.com/@
                                                                </Typography>
                                                            )
                                                        }}
                                                    />
                                                </Paper>
                                            </Stack>
                                        </Show>

                                        <Show when={hasPlatform('kick')}>
                                            <Alert
                                                severity="info"
                                                sx={{
                                                    mt: 2,
                                                    bgcolor: 'rgba(34, 197, 94, 0.1)',
                                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                                    color: '#bbf7d0'
                                                }}
                                            >
                                                Kick mode is live. Some Twitch-only features are hidden in Kick mode.
                                            </Alert>
                                        </Show>
                                        <Show when={hasPlatform('youtube')}>
                                            <Alert
                                                severity="info"
                                                sx={{
                                                    mt: 2,
                                                    bgcolor: 'rgba(239, 68, 68, 0.12)',
                                                    border: '1px solid rgba(239, 68, 68, 0.35)',
                                                    color: '#fecaca'
                                                }}
                                            >
                                                YouTube chat is live. Super Chats and 7TV emotes/paints are supported.
                                            </Alert>
                                        </Show>
                                    </Paper>

                                    {/* Feature Tabs */}
                                    <Box>
                                        <Paper class="glass-panel" sx={{ p: 0.75, mb: 2, display: 'flex', borderRadius: 3 }}>
                                            <For each={['General', 'Visuals', 'Safety']}>
                                                {(tab, idx) => (
                                                    <Button
                                                        fullWidth
                                                        onClick={() => setActiveTab(idx())}
                                                        sx={{
                                                            py: 1.2,
                                                            borderRadius: 2.5,
                                                            transition: 'all 0.3s',
                                                            ...(activeTab() === idx() ? activeTabStyle : inactiveTabStyle)
                                                        }}
                                                    >
                                                        {tab}
                                                    </Button>
                                                )}
                                            </For>
                                        </Paper>

                                        <Paper class="glass-panel" sx={{ p: 4, minHeight: hasPlatform('twitch') ? 450 : 320 }}>

                                            {/* General */}
                                            <Show when={activeTab() === 0}>
                                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Chat Features</Typography>
                                                <Stack spacing={2}>
                                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <FormControlLabel control={<Switch checked={showPlatformBadge()} onChange={(_, v) => setShowPlatformBadge(v)} color="secondary" />} label="Show Platform Badge" />
                                                        <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary', mt: -0.5 }}>
                                                            Adds a small platform tag before usernames.
                                                        </Typography>
                                                        <FormControlLabel control={<Switch checked={showTimestamps()} onChange={(_, v) => setShowTimestamps(v)} color="secondary" />} label="Show Timestamps" />
                                                    </Box>

                                                    <For each={sectionPlatforms()}>
                                                        {(platform) => (
                                                            <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
                                                                    {renderPlatformLabel(platform)}
                                                                </Typography>
                                                                <Show when={platform === 'twitch'}>
                                                                    <>
                                                                        <FormControlLabel
                                                                            control={<Switch checked={showSharedChat()} onChange={(_, v) => setShowSharedChat(v)} color="secondary" />}
                                                                            label="Shared Chat Integration"
                                                                        />
                                                                        <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary', mt: -0.5 }}>
                                                                            Support for Stream Together / Guest Star sources.
                                                                        </Typography>
                                                                        <FormControlLabel control={<Switch checked={showReplies()} onChange={(_, v) => setShowReplies(v)} color="secondary" />} label="Show Replies" />
                                                                        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(244, 114, 182, 0.1), rgba(221, 160, 221, 0.1))', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                            <FormControlLabel
                                                                                control={<Switch checked={showPronouns()} onChange={(_, v) => setShowPronouns(v)} color="primary" />}
                                                                                label={<Typography sx={{ fontWeight: 600, color: '#F472B6' }}>Show Pronouns</Typography>}
                                                                            />
                                                                            <Show when={showPronouns()}>
                                                                                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                                                                                    Displays user pronouns from <a href="https://pr.alejo.io" target="_blank" style={{ color: '#fff', "font-weight": 700 }}>Alejo.io</a>.
                                                                                </Typography>
                                                                                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, rgba(228, 3, 3, 0.12), rgba(255, 140, 0, 0.12), rgba(255, 237, 0, 0.12), rgba(0, 200, 80, 0.12), rgba(80, 120, 255, 0.12), rgba(180, 80, 255, 0.12))', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                                                    <FormControlLabel
                                                                                        control={<Switch checked={pridePronouns()} onChange={(_, v) => setPridePronouns(v)} color="primary" />}
                                                                                        label={
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                <span style={{ "font-size": '1.1rem' }}>🏳️‍🌈</span>
                                                                                                <Typography sx={{
                                                                                                    fontWeight: 700,
                                                                                                    fontSize: '0.9rem',
                                                                                                    color: '#fff',
                                                                                                    textShadow: '0 0 10px rgba(255, 140, 0, 0.5), 0 0 20px rgba(180, 80, 255, 0.3)'
                                                                                                }}>
                                                                                                    Pride Mode
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        }
                                                                                    />
                                                                                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', pl: 4, mt: -0.5 }}>
                                                                                        All pronoun badges become animated rainbow
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Show>
                                                                        </Box>
                                                                    </>
                                                                </Show>
                                                                <Show when={platform !== 'twitch'}>
                                                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                        No platform-specific settings in this section.
                                                                    </Typography>
                                                                </Show>
                                                            </Box>
                                                        )}
                                                    </For>
                                                </Stack>
                                            </Show>

                                            {/* Visuals */}
                                            <Show when={activeTab() === 1}>
                                                <Stack spacing={4}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Typography</Typography>
                                                        <Box sx={{ mb: 3 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                <Typography variant="body2" color="text.secondary">Font Size</Typography>
                                                                <Typography variant="body2" fontWeight={600}>{fontSize()}px</Typography>
                                                            </Box>
                                                            <GradientSlider min={12} max={48} value={fontSize()} onChange={setFontSize} />
                                                        </Box>

                                                        <FormControlLabel
                                                            control={<Switch checked={useCustomFont()} onChange={(_, v) => setUseCustomFont(v)} size="small" />}
                                                            label={<Typography variant="body2">Use Custom Font</Typography>}
                                                        />
                                                        <Show when={useCustomFont()}>
                                                            <TextField
                                                                fullWidth size="small" placeholder="Font Family Name"
                                                                value={customFont()} onChange={(e) => setCustomFont(e.target.value)}
                                                                sx={{ mt: 1, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
                                                            />
                                                        </Show>
                                                        <Show when={!useCustomFont()}>
                                                            <select
                                                                value={selectedFont()}
                                                                onChange={(e) => setSelectedFont(e.currentTarget.value)}
                                                                style={{
                                                                    width: '100%', padding: '10px', "margin-top": '8px',
                                                                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', "border-radius": '8px', color: '#fff', outline: 'none'
                                                                }}
                                                            >
                                                                <For each={PRESET_FONTS}>{(f) => <option value={f.value} style={{ background: '#09090b' }}>{f.name}</option>}</For>
                                                            </select>
                                                        </Show>
                                                    </Box>

                                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                                                    <Box>
                                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Elements</Typography>
                                                        <Stack spacing={2}>
                                                            <For each={sectionPlatforms()}>
                                                                {(platform) => (
                                                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
                                                                            {renderPlatformLabel(platform)}
                                                                        </Typography>
                                                                        <Show when={platform === 'twitch' || platform === 'kick' || platform === 'youtube'}>
                                                                            <>
                                                                                <Show when={platform === 'twitch' || platform === 'kick'}>
                                                                                    <FormControlLabel control={<Switch checked={showBadges()} onChange={(_, v) => setShowBadges(v)} color="secondary" />} label="Subscriber Badges" />
                                                                                </Show>
                                                                                <FormControlLabel control={<Switch checked={showNamePaints()} onChange={(_, v) => setShowNamePaints(v)} color="secondary" />} label="7TV Name Paints" />
                                                                                <Show when={platform === 'twitch'}>
                                                                                    <FormControlLabel control={<Switch checked={showRoomState()} onChange={(_, v) => setShowRoomState(v)} color="secondary" />} label="Show Room State" />
                                                                                </Show>

                                                                                <Box sx={{ pt: 1 }}>
                                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                                        <FormControlLabel control={<Switch checked={showEmotes()} onChange={(_, v) => setShowEmotes(v)} color="secondary" />} label="Emotes" />
                                                                                        <Show when={showEmotes()}>
                                                                                            <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 1, py: 0.5, borderRadius: 1 }}>{emoteScale().toFixed(1)}x Scale</Typography>
                                                                                        </Show>
                                                                                    </Box>
                                                                                    <Show when={showEmotes()}>
                                                                                        <GradientSlider min={0.5} max={4.0} step={0.1} value={emoteScale()} onChange={setEmoteScale} />
                                                                                    </Show>
                                                                                </Box>
                                                                            </>
                                                                        </Show>
                                                                        <Show when={platform === 'youtube'}>
                                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                YouTube supports 7TV emotes and paints.
                                                                            </Typography>
                                                                        </Show>
                                                                    </Box>
                                                                )}
                                                            </For>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </Show>

                                            {/* Safety */}
                                            <Show when={activeTab() === 2}>
                                                <Stack spacing={3}>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>Clutter Control</Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                                            Keep your overlay clean and readable.
                                                        </Typography>

                                                        <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', mb: 3 }}>
                                                            <FormControlLabel control={<Switch checked={fadeOutMessages()} onChange={(_, v) => setFadeOutMessages(v)} color="primary" />} label="Fade Out Old Messages" />
                                                            <Show when={fadeOutMessages()}>
                                                                <Box sx={{ mt: 2 }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                                        <Typography variant="caption" color="text.secondary">Disappear after</Typography>
                                                                        <Typography variant="caption" fontWeight={600}>{fadeOutDelay()} seconds</Typography>
                                                                    </Box>
                                                                    <GradientSlider min={5} max={120} step={5} value={fadeOutDelay()} onChange={setFadeOutDelay} />
                                                                </Box>
                                                            </Show>
                                                        </Box>

                                                        <Typography gutterBottom variant="body2">Max Messages On Screen: {maxMessages()}</Typography>
                                                        <GradientSlider min={5} max={100} value={maxMessages()} onChange={setMaxMessages} />
                                                    </Box>

                                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

                                                    <Box>
                                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Filter</Typography>
                                                        <Stack spacing={2}>
                                                            <For each={sectionPlatforms()}>
                                                                {(platform) => (
                                                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255,255,255,0.7)' }}>
                                                                            {renderPlatformLabel(platform)}
                                                                        </Typography>
                                                                        <Show when={platform === 'twitch' || platform === 'kick'}>
                                                                            <>
                                                                                <TextField
                                                                                    fullWidth size="small"
                                                                                    label="Block Users (comma separated)"
                                                                                    placeholder="user1, user2"
                                                                                    value={blockedUsers()}
                                                                                    onChange={(e) => setBlockedUsers(e.target.value)}
                                                                                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
                                                                                />
                                                                                <TextField
                                                                                    fullWidth size="small"
                                                                                    label="Hide Custom Bots (comma separated)"
                                                                                    placeholder="bot1, bot2"
                                                                                    value={customBots()}
                                                                                    onChange={(e) => setCustomBots(e.target.value)}
                                                                                    sx={{ mt: 2, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
                                                                                />
                                                                                <Box sx={{ mt: 2 }}>
                                                                                    <FormControlLabel control={<Switch checked={hideCommands()} onChange={(_, v) => setHideCommands(v)} color="error" />} label="Hide !commands (Exclamations)" />
                                                                                    <FormControlLabel control={<Switch checked={hideBots()} onChange={(_, v) => setHideBots(v)} color="error" />} label="Hide Common Bots (Streamelements, etc)" />
                                                                                </Box>
                                                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                    These filters apply across Twitch and Kick.
                                                                                </Typography>
                                                                            </>
                                                                        </Show>
                                                                        <Show when={platform === 'youtube'}>
                                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                                No filters available for YouTube yet.
                                                                            </Typography>
                                                                        </Show>
                                                                    </Box>
                                                                )}
                                                            </For>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </Show>

                                        </Paper>
                                    </Box>

                                    {/* URL Generator */}
                                    <Show when={getPrimaryChannel()}>
                                        <Paper class="glass-panel" sx={{ p: 3, background: 'rgba(0,0,0,0.3) !important', borderColor: '#F472B6 !important' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(to right, #F472B6, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                Your Overlay URL
                                            </Typography>

                                            <Box sx={{ p: 2, bgcolor: '#0f0c29', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)', mb: 1, fontFamily: 'monospace', fontSize: '0.8rem', color: '#2DD4BF', wordBreak: 'break-all' }}>
                                                {generateUrl()}
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mb: 3, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                                                Recommended Resolution: 450x800 (Included in drag data)
                                            </Typography>

                                            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                                <Button
                                                    variant="contained"
                                                    fullWidth
                                                    onClick={handleCopy}
                                                    startIcon={copied() ? <CheckCircleIcon /> : <ContentCopyIcon />}
                                                    sx={{ bgcolor: copied() ? '#10B981' : '#F472B6', '&:hover': { bgcolor: copied() ? '#059669' : '#DB2777' } }}
                                                >
                                                    {copied() ? 'Copied URL' : 'Copy URL'}
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    fullWidth
                                                    onClick={handleOpen}
                                                    startIcon={<OpenInNewIcon />}
                                                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', '&:hover': { borderColor: '#fff' } }}
                                                >
                                                    Open
                                                </Button>
                                            </Stack>

                                            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2, textAlign: 'center' }}>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, display: 'block' }}>
                                                    Or drag to OBS
                                                </Typography>
                                                <a
                                                    href={generateUrl()}
                                                    draggable={true}
                                                    onDragStart={(e) => {
                                                        if (e.dataTransfer) {
                                                            const urlStr = generateUrl();
                                                            const urlObj = new URL(urlStr);
                                                            urlObj.searchParams.set("layer-width", "450");
                                                            urlObj.searchParams.set("layer-height", "800");
                                                            const url = urlObj.toString();

                                                            e.dataTransfer.setData("text/plain", url);
                                                            e.dataTransfer.setData("text/uri-list", url);
                                                            e.dataTransfer.setData("text/html", `<a href="${url}">Kroma Chat</a>`);
                                                            e.dataTransfer.setData("text/x-moz-url", `${url}\nKroma Chat`);
                                                            const img = new Image();
                                                            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                            e.dataTransfer.setDragImage(img, 0, 0);
                                                        }
                                                    }}
                                                    style={{ "text-decoration": 'none', display: 'inline-block' }}
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    <Button
                                                        startIcon={<DragIndicatorIcon />}
                                                        sx={{
                                                            color: 'rgba(255,255,255,0.8)',
                                                            cursor: 'grab',
                                                            '&:hover': { background: 'rgba(255,255,255,0.05)', color: '#fff' }
                                                        }}
                                                    >
                                                        Drag Me to OBS
                                                    </Button>
                                                </a>
                                            </Box>
                                        </Paper>
                                    </Show>

                                </Stack>
                            </Grid>

                            {/* Preview Column */}
                            <Grid item xs={12} lg={8}>
                                <Box sx={{ position: { lg: 'sticky' }, top: { lg: 40 }, height: { lg: 'calc(100vh - 80px)' } }}>
                                    <Paper class="glass-panel" sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                                        {/* Preview Header */}
                                        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.2)' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, color: 'rgba(255,255,255,0.8)' }}>
                                                <VisibilityIcon sx={{ fontSize: 18, color: '#2DD4BF' }} />
                                                Live Preview
                                            </Typography>
                                            <Stack direction="row" spacing={1}>
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#EF4444' }} />
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#F59E0B' }} />
                                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10B981' }} />
                                            </Stack>
                                        </Box>

                                        {/* Iframe */}
                                        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#000' }}>
                                            <Show when={previewUrl()} fallback={
                                                <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, color: 'rgba(255,255,255,0.2)' }}>
                                                    <Typography variant="h6">Enter channel to preview</Typography>
                                                </Box>
                                            }>
                                                <iframe
                                                    src={previewUrl()}
                                                    style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
                                                    allow="autoplay"
                                                />
                                            </Show>

                                            {/* Checkerboard for transparency */}
                                            <Box sx={{
                                                position: 'absolute', inset: 0, zIndex: -1,
                                                backgroundImage: `linear-gradient(45deg, #111 25%, transparent 25%), linear-gradient(-45deg, #111 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #111 75%), linear-gradient(-45deg, transparent 75%, #111 75%)`,
                                                backgroundSize: '20px 20px',
                                                opacity: 0.3
                                            }} />
                                        </Box>

                                    </Paper>
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>

                    <Box sx={{ py: 3, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(9, 9, 11, 0.4)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                            Made with 💜 by <a href="https://www.twitch.tv/scaptiq" target="_blank" style={{ color: '#F472B6', "text-decoration": 'none', "font-weight": 600 }}>scaptiq</a> • Inspired by <a href="https://github.com/IS2511/ChatIS" target="_blank" style={{ color: '#2DD4BF', "text-decoration": 'none', "font-weight": 600 }}>ChatIS</a>
                        </Typography>
                    </Box>
                </Box>
            </ThemeProvider>
        </>
    );
}

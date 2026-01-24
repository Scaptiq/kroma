import { createSignal, Show, For, createEffect } from "solid-js";
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
    const [channel, setChannel] = createSignal("");
    const [showPronouns, setShowPronouns] = createSignal(true);
    const [showBadges, setShowBadges] = createSignal(true);
    const [showEmotes, setShowEmotes] = createSignal(true);
    const [showTimestamps, setShowTimestamps] = createSignal(false);
    const [showSharedChat, setShowSharedChat] = createSignal(true);
    const [showNamePaints, setShowNamePaints] = createSignal(true);
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

    // Update preview URL when settings change
    createEffect(() => {
        const params = new URLSearchParams();
        // Use demo channel for preview if no channel entered
        const ch = channel();

        if (!ch) {
            setPreviewUrl("");
            return;
        }

        if (!showPronouns()) params.set('pronouns', 'false');
        if (!showBadges()) params.set('badges', 'false');
        if (!showEmotes()) params.set('emotes', 'false');
        if (showTimestamps()) params.set('timestamps', 'true');
        if (!showSharedChat()) params.set('shared', 'false');
        if (!showNamePaints()) params.set('paints', 'false');
        if (!showReplies()) params.set('replies', 'false');
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

        const queryString = params.toString();
        setPreviewUrl(`/v3/chat/${ch}?${queryString}`);
    });

    const generateUrl = () => {
        if (!channel()) return "";
        const base = `${typeof window !== 'undefined' ? window.location.origin : ''}/v3/chat/${channel()}`;
        // We can reuse the search params logic but it's bound to the effect.
        // Replicating simple string generation for the input box:
        const url = new URL(base);
        if (!showPronouns()) url.searchParams.set('pronouns', 'false');
        if (!showBadges()) url.searchParams.set('badges', 'false');
        if (!showEmotes()) url.searchParams.set('emotes', 'false');
        if (showTimestamps()) url.searchParams.set('timestamps', 'true');
        if (!showSharedChat()) url.searchParams.set('shared', 'false');
        if (!showNamePaints()) url.searchParams.set('paints', 'false');
        if (!showReplies()) url.searchParams.set('replies', 'false');
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
                                        <img src="/logo.png" style={{ width: '100%', height: '100%', "object-fit": 'cover' }} alt="Kroma Logo" />
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
                                            Welcome to Kroma. Enter your Twitch channel below to get started.
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            placeholder="twitch_username"
                                            value={channel()}
                                            onChange={(e) => setChannel(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    bgcolor: 'rgba(0,0,0,0.2)',
                                                    borderRadius: 2,
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&.Mui-focused fieldset': { borderColor: '#F472B6' }
                                                }
                                            }}
                                            InputProps={{
                                                startAdornment: <Typography sx={{ color: 'rgba(255,255,255,0.4)', mr: 1, fontWeight: 600 }}>twitch.tv/</Typography>
                                            }}
                                        />
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

                                        <Paper class="glass-panel" sx={{ p: 4, minHeight: 450 }}>

                                            {/* General */}
                                            <Show when={activeTab() === 0}>
                                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Chat Features</Typography>
                                                <Stack spacing={2}>
                                                    <Box sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <FormControlLabel
                                                            control={<Switch checked={showSharedChat()} onChange={(_, v) => setShowSharedChat(v)} color="secondary" />}
                                                            label={<Typography sx={{ fontWeight: 500 }}>Shared Chat Integration</Typography>}
                                                        />
                                                        <Typography variant="caption" sx={{ display: 'block', pl: 4, color: 'text.secondary', mt: -0.5 }}>
                                                            Support for Stream Together / Guest Star sources.
                                                        </Typography>
                                                    </Box>

                                                    <FormControlLabel control={<Switch checked={showReplies()} onChange={(_, v) => setShowReplies(v)} color="secondary" />} label="Show Replies" />
                                                    <FormControlLabel control={<Switch checked={showTimestamps()} onChange={(_, v) => setShowTimestamps(v)} color="secondary" />} label="Show Timestamps" />

                                                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

                                                    <Box sx={{ p: 2, borderRadius: 3, background: 'linear-gradient(135deg, rgba(192, 132, 252, 0.1), rgba(244, 114, 182, 0.1), rgba(221, 160, 221, 0.1))', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <FormControlLabel
                                                            control={<Switch checked={showPronouns()} onChange={(_, v) => setShowPronouns(v)} color="primary" />}
                                                            label={<Typography sx={{ fontWeight: 600, color: '#F472B6' }}>Show Pronouns</Typography>}
                                                        />
                                                        <Show when={showPronouns()}>
                                                            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.7)', mt: 1 }}>
                                                                Displays user pronouns from <a href="https://pr.alejo.io" target="_blank" style={{ color: '#fff', "font-weight": 700 }}>Alejo.io</a>.
                                                            </Typography>
                                                        </Show>
                                                    </Box>
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
                                                        <Stack spacing={1}>
                                                            <FormControlLabel control={<Switch checked={showBadges()} onChange={(_, v) => setShowBadges(v)} color="secondary" />} label="Subscriber Badges" />
                                                            <FormControlLabel control={<Switch checked={showNamePaints()} onChange={(_, v) => setShowNamePaints(v)} color="secondary" />} label="7TV Name Paints" />

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
                                                                sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'rgba(0,0,0,0.2)' } }}
                                                            />

                                                            <Box>
                                                                <FormControlLabel control={<Switch checked={hideCommands()} onChange={(_, v) => setHideCommands(v)} color="error" />} label="Hide !commands (Exclamations)" />
                                                                <FormControlLabel control={<Switch checked={hideBots()} onChange={(_, v) => setHideBots(v)} color="error" />} label="Hide Common Bots (Streamelements, etc)" />
                                                            </Box>
                                                        </Stack>
                                                    </Box>
                                                </Stack>
                                            </Show>

                                        </Paper>
                                    </Box>

                                    {/* URL Generator */}
                                    <Show when={channel()}>
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
                                                            urlObj.searchParams.set("width", "450");
                                                            urlObj.searchParams.set("height", "800");
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
                            Made with 💜 by <a href="https://www.twitch.tv/scaptiq" target="_blank" style={{ color: '#F472B6', "text-decoration": 'none', "font-weight": 600 }}>scaptiq</a> • Original by <a href="https://github.com/IS2511/ChatIS" target="_blank" style={{ color: '#2DD4BF', "text-decoration": 'none', "font-weight": 600 }}>ChatIS</a>
                        </Typography>
                    </Box>
                </Box>
            </ThemeProvider>
        </>
    );
}

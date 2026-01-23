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
            mode: "dark",
            primary: { main: '#a855f7' }, // Purple-500
            secondary: { main: '#10b981' }, // Emerald-500
            background: { default: '#0f172a', paper: 'rgba(30, 41, 59, 0.7)' }
        },
        typography: {
            fontFamily: '"Segoe UI", "Inter", "Roboto", sans-serif',
        },
        components: {
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    }
                }
            }
        }
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
    const [selectedFont, setSelectedFont] = createSignal('Segoe UI');
    const [customFont, setCustomFont] = createSignal('');
    const [useCustomFont, setUseCustomFont] = createSignal(false);

    const [copied, setCopied] = createSignal(false);
    const [previewUrl, setPreviewUrl] = createSignal("");

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

    return (
        <>
            <MySiteTitle>Kroma - Setup</MySiteTitle>
            <ThemeProvider theme={theme}>
                {/* Background */}
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        background: 'linear-gradient(to bottom right, #0f172a, #1e1b4b)',
                        zIndex: -2,
                    }}
                />
                <Box
                    sx={{
                        position: 'fixed',
                        top: '-20%',
                        left: '-20%',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%)',
                        filter: 'blur(80px)',
                        zIndex: -1,
                        animation: 'blob 20s infinite alternate'
                    }}
                />
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: '-20%',
                        right: '-20%',
                        width: '60%',
                        height: '60%',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, rgba(0,0,0,0) 70%)',
                        filter: 'blur(80px)',
                        zIndex: -1,
                        animation: 'blob 20s infinite alternate-reverse'
                    }}
                />
                <style>{`
                    @keyframes blob {
                        0% { transform: translate(0, 0) scale(1); }
                        100% { transform: translate(50px, 50px) scale(1.1); }
                    }
                    .glass-panel {
                        background: rgba(30, 41, 59, 0.4);
                        backdrop-filter: blur(16px);
                        border: 1px solid rgba(255, 255, 255, 0.05);
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    }
                `}</style>

                <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ py: 3, borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10 }}>
                        <Container maxWidth="xl">
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(168, 85, 247, 0.5)' }}>
                                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'white' }}>K</Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Kroma
                                    </Typography>
                                </Stack>
                                <a href="https://github.com/scaptiq/kroma" target="_blank" style={{ "text-decoration": 'none', display: 'flex' }}>
                                    <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.7)', "&:hover": { color: "#fff" } }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.616-4.033-1.616-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                    </IconButton>
                                </a>
                            </Stack>
                        </Container>
                    </Box>

                    <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
                        <Grid container spacing={4} sx={{ height: '100%' }}>

                            {/* LEFT COLUMN: SETTINGS */}
                            <Grid item xs={12} lg={4}>
                                <Stack spacing={3}>

                                    <Paper class="glass-panel" sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <SettingsIcon sx={{ color: '#a855f7' }} /> Channel
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Twitch Username"
                                            placeholder="xqc"
                                            value={channel()}
                                            onChange={(e) => setChannel(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                            variant="outlined"
                                            sx={{
                                                mb: 1,
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                    '&.Mui-focused fieldset': { borderColor: '#a855f7' }
                                                }
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                            Enter a channel to generate your URL. The preview will update automatically.
                                        </Typography>
                                    </Paper>

                                    <Paper class="glass-panel" sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Appearance</Typography>

                                        <Stack spacing={2}>
                                            <Box>
                                                <Typography gutterBottom variant="body2" color="text.secondary">Font Size: {fontSize()}px</Typography>
                                                <input
                                                    type="range"
                                                    min="12" max="32"
                                                    value={fontSize()}
                                                    onInput={(e) => setFontSize(parseInt(e.currentTarget.value))}
                                                    class="styled-slider"
                                                    style={{ width: '100%' }}
                                                />
                                            </Box>

                                            {/* Font Selection */}
                                            <Box>
                                                <Typography gutterBottom variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TextFieldsIcon sx={{ fontSize: 16 }} /> Font Family
                                                </Typography>

                                                <FormControlLabel
                                                    control={<Switch checked={useCustomFont()} onChange={(_, v) => setUseCustomFont(v)} color="primary" size="small" />}
                                                    label={<Typography variant="caption">Use custom font</Typography>}
                                                    sx={{ mb: 1 }}
                                                />

                                                <Show when={!useCustomFont()}>
                                                    <select
                                                        value={selectedFont()}
                                                        onChange={(e) => setSelectedFont(e.currentTarget.value)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px 12px',
                                                            background: 'rgba(0, 0, 0, 0.3)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            "border-radius": '8px',
                                                            color: '#fff',
                                                            "font-size": '14px',
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <For each={PRESET_FONTS}>
                                                            {(font) => (
                                                                <option value={font.value} style={{ background: '#1e293b', color: '#fff' }}>
                                                                    {font.name}
                                                                </option>
                                                            )}
                                                        </For>
                                                    </select>
                                                </Show>

                                                <Show when={useCustomFont()}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Enter font name (e.g., Arial, Comic Sans MS)"
                                                        value={customFont()}
                                                        onChange={(e) => setCustomFont(e.target.value)}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                                                '&.Mui-focused fieldset': { borderColor: '#a855f7' }
                                                            }
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5, display: 'block' }}>
                                                        Use any font installed on your PC. OBS will use this font if available.
                                                    </Typography>
                                                </Show>
                                            </Box>

                                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

                                            <FormControlLabel
                                                control={<Switch checked={showBadges()} onChange={(_, v) => setShowBadges(v)} color="primary" />}
                                                label={<Box><Typography>Badges</Typography><Typography variant="caption" color="text.secondary">Subscriber, Moderator, etc.</Typography></Box>}
                                            />
                                            <FormControlLabel
                                                control={<Switch checked={showEmotes()} onChange={(_, v) => setShowEmotes(v)} color="primary" />}
                                                label={<Box><Typography>Emotes</Typography><Typography variant="caption" color="text.secondary">7TV, BTTV, FFZ support</Typography></Box>}
                                            />
                                            <FormControlLabel
                                                control={<Switch checked={showNamePaints()} onChange={(_, v) => setShowNamePaints(v)} color="primary" />}
                                                label={<Box><Typography>Name Paints</Typography><Typography variant="caption" color="text.secondary">7TV Gradient Usernames</Typography></Box>}
                                            />
                                            <FormControlLabel
                                                control={<Switch checked={showPronouns()} onChange={(_, v) => setShowPronouns(v)} color="primary" />}
                                                label={<Box><Typography>Pronouns</Typography><Typography variant="caption" color="text.secondary">Display user pronouns</Typography></Box>}
                                            />
                                            <Show when={showPronouns()}>
                                                <Alert
                                                    severity="info"
                                                    icon={<InfoIcon />}
                                                    sx={{
                                                        mt: 1,
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        border: '1px solid rgba(59, 130, 246, 0.2)',
                                                        '& .MuiAlert-message': { width: '100%' }
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                                                        Users can set their pronouns at:
                                                    </Typography>
                                                    <a
                                                        href="https://pr.alejo.io/"
                                                        target="_blank"
                                                        style={{
                                                            color: '#60a5fa',
                                                            "font-weight": 600,
                                                            "text-decoration": 'none'
                                                        }}
                                                    >
                                                        pr.alejo.io →
                                                    </a>
                                                </Alert>
                                            </Show>
                                        </Stack>
                                    </Paper>

                                    <Paper class="glass-panel" sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Features</Typography>
                                        <Stack spacing={1}>
                                            <FormControlLabel control={<Switch checked={showSharedChat()} onChange={(_, v) => setShowSharedChat(v)} color="secondary" />} label="Shared Chat (Stream Together)" />
                                            <FormControlLabel control={<Switch checked={showReplies()} onChange={(_, v) => setShowReplies(v)} color="secondary" />} label="Message Replies" />
                                            <FormControlLabel control={<Switch checked={showTimestamps()} onChange={(_, v) => setShowTimestamps(v)} color="secondary" />} label="Show Timestamps" />
                                            <FormControlLabel control={<Switch checked={hideCommands()} onChange={(_, v) => setHideCommands(v)} color="error" />} label="Hide !commands" />
                                            <FormControlLabel control={<Switch checked={hideBots()} onChange={(_, v) => setHideBots(v)} color="error" />} label="Hide Common Bots" />
                                        </Stack>
                                    </Paper>

                                    <Show when={channel()}>
                                        <Paper class="glass-panel" sx={{ p: 3, background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(16, 185, 129, 0.1))', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#a855f7' }}>Your Overlay URL</Typography>
                                            <Box sx={{
                                                p: 2,
                                                background: 'rgba(0,0,0,0.3)',
                                                borderRadius: 1,
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                wordBreak: 'break-all',
                                                color: '#10b981',
                                                mb: 2,
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {generateUrl()}
                                            </Box>
                                            <Stack spacing={2}>
                                                <Stack direction="row" spacing={2}>
                                                    <Button
                                                        variant="contained"
                                                        startIcon={copied() ? <CheckCircleIcon /> : <ContentCopyIcon />}
                                                        onClick={handleCopy}
                                                        color={copied() ? "success" : "primary"}
                                                        fullWidth
                                                    >
                                                        {copied() ? "Copied!" : "Copy URL"}
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<OpenInNewIcon />}
                                                        onClick={handleOpen}
                                                        color="primary"
                                                        fullWidth
                                                    >
                                                        Open
                                                    </Button>
                                                </Stack>

                                                <Box sx={{ pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                                            Recommended Size:
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#a855f7', fontWeight: 600, fontFamily: 'monospace' }}>
                                                            450 x 800 <span style={{ opacity: 0.5, "font-size": "0.8em" }}>(Set in OBS)</span>
                                                        </Typography>
                                                    </Stack>

                                                    <a
                                                        href={generateUrl()}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            if (e.dataTransfer) {
                                                                const url = generateUrl();
                                                                e.dataTransfer.setData("text/plain", url);
                                                                e.dataTransfer.setData("text/uri-list", url);
                                                                e.dataTransfer.setData("text/html", `<a href="${url}">Kroma Chat</a>`);
                                                                e.dataTransfer.setData("text/x-moz-url", `${url}\nKroma Chat`);

                                                                // Hide the button ghost
                                                                const img = new Image();
                                                                img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                                e.dataTransfer.setDragImage(img, 0, 0);
                                                            }
                                                        }}
                                                        style={{ "text-decoration": 'none', display: 'block' }}
                                                        onClick={(e) => e.preventDefault()}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<DragIndicatorIcon />}
                                                            fullWidth
                                                            sx={{
                                                                color: 'rgba(255,255,255,0.8)',
                                                                borderColor: 'rgba(255,255,255,0.2)',
                                                                background: 'rgba(255,255,255,0.02)',
                                                                '&:hover': {
                                                                    borderColor: '#a855f7',
                                                                    background: 'rgba(168, 85, 247, 0.05)'
                                                                },
                                                                cursor: 'grab',
                                                                textTransform: 'none'
                                                            }}
                                                        >
                                                            Drag to OBS Source
                                                        </Button>
                                                    </a>
                                                </Box>
                                            </Stack>
                                        </Paper>
                                    </Show>

                                </Stack>
                            </Grid>

                            {/* RIGHT COLUMN: PREVIEW */}
                            <Grid item xs={12} lg={8} sx={{ height: { lg: 'calc(100vh - 100px)' }, position: { lg: 'sticky' }, top: { lg: 100 } }}>
                                <Paper
                                    class="glass-panel"
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <VisibilityIcon sx={{ color: '#10b981' }} /> Live Preview
                                            <Typography component="span" variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', ml: 1 }}>
                                                {channel() ? `(Showing channel: ${channel()})` : '(Waiting for input)'}
                                            </Typography>
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444' }} />
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B' }} />
                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} />
                                        </Box>
                                    </Box>

                                    <Box sx={{ flex: 1, position: 'relative', background: 'black' }}>
                                        <Show when={previewUrl()} fallback={
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', flexDirection: 'column', gap: 2 }}>
                                                <Typography variant="h6">Enter a channel to preview</Typography>
                                            </Box>
                                        }>
                                            <iframe
                                                src={previewUrl()}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    border: 'none',
                                                    background: 'transparent' // Allow overlay transparency to show
                                                }}
                                                allow="autoplay"
                                            />
                                        </Show>

                                        {/* Background simulator for transparency check */}
                                        <Box sx={{
                                            position: 'absolute',
                                            inset: 0,
                                            zIndex: -1,
                                            backgroundImage: 'linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)',
                                            backgroundSize: '20px 20px',
                                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                            opacity: 0.2
                                        }} />
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Container>

                    {/* Footer */}
                    <Box sx={{ textAlign: 'center', py: 3, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15, 23, 42, 0.4)' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                            Kroma • Made with 💜 by <span style={{ color: '#a855f7', "font-weight": 600 }}>scaptiq</span> • Based on <a href="https://github.com/IS2511/ChatIS" target="_blank" style={{ color: 'inherit', "text-decoration": 'underline' }}>ChatIS</a>
                        </Typography>
                    </Box>
                </Box>
            </ThemeProvider >
        </>
    );
}

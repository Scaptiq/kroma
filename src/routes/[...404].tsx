import { useNavigate } from "solid-start";
import { Box, Button, Container, Paper, Stack, ThemeProvider, Typography, createTheme } from "@suid/material";
import MySiteTitle from "~/components/MySiteTitle";

export default function NotFound() {
  const navigate = useNavigate();
  const theme = createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#F472B6" },
      secondary: { main: "#2DD4BF" },
      background: {
        default: "transparent",
        paper: "rgba(255, 255, 255, 0.05)",
      },
      text: {
        primary: "#fff",
        secondary: "rgba(255, 255, 255, 0.7)",
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", sans-serif',
      button: { fontWeight: 600, textTransform: "none" },
      h3: { fontWeight: 800 },
    },
    shape: { borderRadius: 16 },
  });

  return (
    <>
      <MySiteTitle>Not Found</MySiteTitle>
      <ThemeProvider theme={theme}>
        <style>{`
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

          .glass-panel {
            background: rgba(255, 255, 255, 0.03) !important;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08) !important;
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
          }
        `}</style>

        <Box sx={{ position: "fixed", inset: 0, bgcolor: "#0f0c29", zIndex: -2, background: "linear-gradient(to bottom right, #1a1b4b, #2e1065, #0f172a)" }} />
        <Box class="aurora-blob" sx={{ top: "10%", left: "10%", width: "40vw", height: "40vw", background: "#4c1d95", animationDelay: "0s" }} />
        <Box class="aurora-blob" sx={{ top: "40%", right: "10%", width: "35vw", height: "35vw", background: "#be185d", animationDelay: "-2s" }} />
        <Box class="aurora-blob" sx={{ bottom: "10%", left: "20%", width: "30vw", height: "30vw", background: "#0e7490", animationDelay: "-4s" }} />

        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative", zIndex: 1 }}>
          <Container maxWidth="md">
            <Paper class="glass-panel" sx={{ p: { xs: 4, md: 6 }, textAlign: "center" }}>
              <Stack spacing={2} alignItems="center">
                <Typography variant="overline" sx={{ letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)" }}>
                  Error 404
                </Typography>
                <Typography variant="h3" sx={{ letterSpacing: "-0.02em" }}>
                  This page drifted off into the aurora.
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.7)", maxWidth: 520 }}>
                  The link you followed doesn’t exist anymore or it never did. Let’s get you back to the setup hub.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
                  <Button
                    variant="contained"
                    sx={{ px: 3, borderRadius: 3, background: "linear-gradient(135deg, #F472B6, #C084FC)" }}
                    onClick={() => navigate("/setup")}
                  >
                    Go to Setup
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{ px: 3, borderRadius: 3, borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                    onClick={() => navigate("/chat")}
                  >
                    Open Chat
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    </>
  );
}

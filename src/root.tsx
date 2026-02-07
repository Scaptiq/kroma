import { createTheme, CssBaseline, ThemeProvider } from "@suid/material";
import { createSignal, onMount, Suspense } from "solid-js";
import {
  useLocation,
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from "solid-start";
import "./root.css";
import { GOOGLE_FONTS_URL } from "~/utils/fonts";

export default function Root() {
  const [isClient, setIsClient] = createSignal(false);
  onMount(() => setIsClient(true));

  const darkTheme = createTheme({
    palette: {
      mode: "dark",
    },
    typography: {
      fontFamily: '"Space Grotesk", "Inter", "Segoe UI", sans-serif',
    }
  });

  return (
    <Html lang="en">
      <Head>
        <Title>Kroma</Title>
        <link rel="icon" type="image/png" href="/kroma-favicon.png" />
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href={GOOGLE_FONTS_URL} />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            {isClient() && (
              <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Routes>
                  <FileRoutes />
                </Routes>
              </ThemeProvider>
            )}
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@400;600;700&family=Poppins:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Lato:wght@400;700&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@400;700&family=Space+Grotesk:wght@400;600;700&family=Work+Sans:wght@400;600;700&family=DM+Sans:wght@400;600;700&family=Manrope:wght@400;600;700&family=Nunito:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&family=Fira+Sans:wght@400;600;700&family=Rubik:wght@400;600;700&family=Raleway:wght@400;600;700&family=Comic+Neue:wght@400;700&family=Comfortaa:wght@400;700&family=Ubuntu:wght@400;700&display=swap"
        />
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

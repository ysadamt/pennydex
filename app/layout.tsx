'use client';

import { MantineProvider } from '@mantine/core';
import "@mantine/core/styles.css";
import '@mantine/carousel/styles.css';
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>PennyDex</title>
        <link rel="icon" href="/favicon.svg" />
        <meta name="description" content="Explore penny press machines worldwide" />
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <MantineProvider
          theme={{
            fontFamily: 'Instrument Sans, sans-serif',
            headings: {
              fontFamily: 'Instrument Serif, serif',
            },
            colors: {
              gray: [
                "#f8f9fa",
                "#f1f3f5",
                "#e9ecef",
                "#dee2e6",
                "#ced4da",
                "#adb5bd",
                "#868e96",
                "#495057",
                "#343a40",
                "#212529",
              ],
            },
          }}
        >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

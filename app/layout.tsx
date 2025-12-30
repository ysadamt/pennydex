'use client';

import { MantineProvider, createTheme, MantineColorsTuple } from '@mantine/core';
import { Analytics } from "@vercel/analytics/next"
import "@mantine/core/styles.css";
import '@mantine/carousel/styles.css';
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-sans/400.css";
import "@fontsource/instrument-sans/500.css";
import "@fontsource/instrument-sans/600.css";
import "@fontsource/instrument-sans/700.css";
import "./globals.css";

// 1. Define the custom color palette (10 shades)
// These shades are generated based on #AD6F69
const pennyDexRed: MantineColorsTuple = [
  "#fcf1f0",
  "#f1e3e2",
  "#dfc6c4",
  "#ceaaaa",
  "#be918f",
  "#AD6F69", // Primary shade
  "#a96760",
  "#965651",
  "#874b46",
  "#783f3a"
];

// 2. Create the theme object
export const theme = createTheme({
  fontFamily: 'Instrument Sans, sans-serif',
  headings: {
    fontFamily: 'Instrument Serif, serif',
  },
  primaryColor: 'pennyRed', // Tell Mantine to use your custom key
  colors: {
    pennyRed: pennyDexRed,
    gray: [
      "#f8f9fa", "#f1f3f5", "#e9ecef", "#dee2e6", "#ced4da",
      "#adb5bd", "#868e96", "#495057", "#343a40", "#212529",
    ],
  },
});

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
        {/* 3. Pass the theme object here */}
        <MantineProvider theme={theme}>
          {children}
          <Analytics />
        </MantineProvider>
      </body>
    </html>
  );
}
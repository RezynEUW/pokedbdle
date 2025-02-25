import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TimeBasedBackground from "@/components/TimeBasedBackground";
import { Rubik, Press_Start_2P } from "next/font/google";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokédle - Daily Pokémon Guessing Game",
  description: "Test your Pokémon knowledge with Pokédle, a daily Wordle-style guessing game with a new Pokémon challenge every day!",
  keywords: "pokemon, game, wordle, pokedle, guessing game, daily puzzle, pokemon quiz",
  authors: [{ name: "Pokédle Team", url: "https://pokedle.day" }],
  creator: "Pokédle Team",
  publisher: "pokedle.day",
  applicationName: "Pokédle",
  metadataBase: new URL("https://pokedle.day"),
  openGraph: {
    title: "Pokédle - Daily Pokémon Guessing Game",
    description: "Test your Pokémon knowledge with a daily guessing game. New challenge every day!",
    url: "https://pokedle.day/",
    siteName: "Pokédle",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Pokédle - Daily Pokémon Guessing Game",
    description: "Test your Pokémon knowledge with a daily guessing game. New challenge every day!",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  alternates: {
    canonical: "https://pokedle.day",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubik.variable} ${pixelFont.variable} antialiased`}
        // style={{ fontFamily: "var(--font-geist-mono), var(--font-geist-sans), sans-serif" }}
      >
        <TimeBasedBackground>
          {children}
        </TimeBasedBackground>
      </body>
    </html>
  );
}
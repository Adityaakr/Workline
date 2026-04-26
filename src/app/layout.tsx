import { auth } from "@/auth";
import ClientProviders from "@/providers";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workline FX",
  description: "Work is global. Money is local. Settle payouts in local stablecoins.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,800,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClientProviders session={session}>{children}</ClientProviders>
      </body>
    </html>
  );
}

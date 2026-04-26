"use client";

import { MiniKit } from "@worldcoin/minikit-js";

export function isWorldAppInstalled() {
  return MiniKit.isInstalled();
}

export function isRunningInWorldApp() {
  return MiniKit.isInWorldApp();
}

export function getMiniKitUserSnapshot() {
  return {
    walletAddress: MiniKit.user.walletAddress,
    username: MiniKit.user.username,
    profilePictureUrl: MiniKit.user.profilePictureUrl,
    verificationStatus: MiniKit.user.verificationStatus,
    preferredCurrency: MiniKit.user.preferredCurrency,
    location: MiniKit.location,
  };
}

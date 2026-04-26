"use client";

import { IDKit, orbLegacy, type RpContext } from "@worldcoin/idkit";

export async function requestWorldIdVerification(action: string) {
  const signatureResponse = await fetch("/api/rp-signature", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!signatureResponse.ok) {
    throw new Error("Unable to create World ID request");
  }

  const rpSig = await signatureResponse.json();
  const rpContext: RpContext = {
    rp_id: rpSig.rp_id,
    nonce: rpSig.nonce,
    created_at: rpSig.created_at,
    expires_at: rpSig.expires_at,
    signature: rpSig.sig,
  };

  const request = await IDKit.request({
    app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}`,
    action,
    rp_context: rpContext,
    allow_legacy_proofs: true,
  }).preset(orbLegacy({ signal: "workline-fx" }));

  const completion = await request.pollUntilCompletion({
    pollInterval: 2_000,
    timeout: 120_000,
  });

  if (!completion.success) {
    throw new Error(completion.error ?? "World ID verification failed");
  }

  const verifyResponse = await fetch("/api/verify-proof", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rp_id: rpContext.rp_id,
      idkitResponse: completion.result,
    }),
  });

  if (!verifyResponse.ok) {
    throw new Error("Backend proof verification failed");
  }

  // TODO: Persist verified status and nullifier in the backend.
  return completion.result;
}

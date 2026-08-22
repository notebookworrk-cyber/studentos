/**
 * Cloud provider config storage. API keys are encrypted with Electron
 * safeStorage (DPAPI on Windows) and persisted to a file in userData.
 * Keys never leave the main process — only redacted status is exposed over IPC.
 */
import { app, safeStorage } from "electron";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const FILE = () => join(app.getPath("userData"), "ai-cloud.json");

function readConfig() {
  try {
    if (!existsSync(FILE())) return null;
    return JSON.parse(readFileSync(FILE(), "utf8"));
  } catch {
    return null;
  }
}

function decrypt(enc) {
  try {
    return safeStorage.decryptString(Buffer.from(enc, "base64"));
  } catch {
    return "";
  }
}

export function getCloudCredentials() {
  const cfg = readConfig();
  if (!cfg?.baseUrl || !cfg?.model) return null;
  return { baseUrl: cfg.baseUrl, model: cfg.model, apiKey: decrypt(cfg.apiKeyEnc ?? "") };
}

export function isCloudConfigured() {
  const cfg = readConfig();
  return !!(cfg?.baseUrl && cfg?.model && decrypt(cfg.apiKeyEnc ?? ""));
}

export function cloudStatus() {
  const cfg = readConfig();
  return {
    configured: isCloudConfigured(),
    baseUrl: cfg?.baseUrl ?? null,
    model: cfg?.model ?? null,
    hasKey: !!cfg?.apiKeyEnc,
  };
}

export function setCloudConfig(baseUrl, model, apiKey) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure key storage is not available on this system");
  }
  const cfg = {
    baseUrl: baseUrl.trim().replace(/\/+$/, ""),
    model: model.trim(),
    apiKeyEnc: safeStorage.encryptString(apiKey.trim()).toString("base64"),
  };
  writeFileSync(FILE(), JSON.stringify(cfg), "utf8");
  return cloudStatus();
}

export function clearCloudConfig() {
  try {
    unlinkSync(FILE());
  } catch {}
}

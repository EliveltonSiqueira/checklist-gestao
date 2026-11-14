// Gera APK + AAB assinados. Uso: npm run android:release
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { platform } from "node:os";

const win = platform() === "win32";
const env = { ...process.env };
// O Capacitor 8 exige JDK 21 (o JDK do Android Studio costuma ser o 17).
if (win && !env.JAVA_HOME && existsSync("C:\\Program Files\\Java\\jdk-21")) env.JAVA_HOME = "C:\\Program Files\\Java\\jdk-21";
if (!env.ANDROID_HOME && win && env.LOCALAPPDATA) env.ANDROID_HOME = env.LOCALAPPDATA + "\\Android\\Sdk";

const run = (c, cwd) => execSync(c, { stdio: "inherit", env, cwd });
run("npm run build");
run("npx cap sync android");
run(win ? ".\\gradlew.bat assembleRelease bundleRelease" : "./gradlew assembleRelease bundleRelease", "android");
mkdirSync("releases", { recursive: true });
copyFileSync("android/app/build/outputs/apk/release/app-release.apk", "releases/checklist-gestao.apk");
copyFileSync("android/app/build/outputs/bundle/release/app-release.aab", "releases/checklist-gestao.aab");
console.log("\nPronto: releases/checklist-gestao.apk e releases/checklist-gestao.aab");

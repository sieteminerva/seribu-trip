import type { iThemeModule } from "../interface";

// 1. Buat Mock Modul Tema Minimal Anda (Contoh Implementasi Singkat)
export const VerticalTheme: iThemeModule = {
  themeId: "vertical",
  name: "🏢 Vertical Normal Stack",
  beforePageRender: (pages, menu, footer) => {
    console.log(VerticalTheme.name, { pages, menu, footer })

    return { pages, menu, footer }

  },
  activate: (shell: HTMLElement) => {
    shell.style.display = "block";
    shell.style.overflow = "initial";
  }
};

export const HorizontalTheme: iThemeModule = {
  themeId: "horizontal",
  name: "↔️ Horizontal Slide Shift",
  beforePageRender: (pages, menu, footer) => {
    console.log(HorizontalTheme.name, { pages, menu, footer });

    return { pages, menu, footer }

  },
  activate: (shell: HTMLElement) => {
    shell.style.display = "flex";
    shell.style.flexDirection = "row";
    shell.style.overflowX = "auto";
  }
};

export const CyberpunkTheme: iThemeModule = {
  themeId: "cyberpunk",
  name: "⚡ Neon Cyberpunk Grid",
  beforePageRender: (pages, menu, footer) => {
    console.log(CyberpunkTheme.name, { pages, menu, footer });

    return { pages, menu, footer }

  },
  activate: (shell: HTMLElement) => {
    shell.style.background = "#0f0c1b";
    shell.style.color = "#00ffcc";
  },
  deactivate: (shell: HTMLElement) => {
    shell.style.background = "";
    shell.style.color = "";
  }
};
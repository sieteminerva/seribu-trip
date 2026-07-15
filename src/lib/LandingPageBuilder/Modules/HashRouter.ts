export interface iRouteState {
  route: string;
  theme: string | null;
  fragment: string;
}

export class HashRouter {
  private defaultRoute: string;
  private currentThemeId: string;
  private onRouteChanged: (state: iRouteState) => void | Promise<void>;

  constructor(
    defaultRoute: string,
    initialTheme: string,
    onRouteChanged: (state: iRouteState) => void | Promise<void>
  ) {
    this.defaultRoute = this.normalizeRoute(defaultRoute);
    this.currentThemeId = this.normalizeTheme(initialTheme) || "default";
    this.onRouteChanged = onRouteChanged;

    // Ikat event listener native browser secara aman
    window.addEventListener("hashchange", this._handleHashChange);
  }

  /**
   * 🧙‍♂️ CORE PUBLIC API: Memicu navigasi programatis murni yang aman dari native override!
   */
  public navigate(routeId: string, themeId: string | null, fragmentId: string = ""): void {
    const activeTheme = this.normalizeTheme(themeId || this.currentThemeId);
    const normalizedState: iRouteState = {
      route: this.normalizeRoute(routeId),
      theme: activeTheme,
      fragment: fragmentId.trim().replace(/^#/, "")
    };
    const targetHash = this.buildHash(normalizedState);

    // Gunakan replaceState atau pushState secara ksatria tanpa memicu letupan hashchange liar!
    window.history.pushState(null, "", targetHash);
    this.currentThemeId = activeTheme;
    localStorage.setItem("active_theme", activeTheme);

    // Jalankan callback pemrosesan data ke level orchestrator luar
    this.onRouteChanged(normalizedState);
  }

  /**
   * 🧙‍♂️ THE NATIVE HASH RESOLVER: Pemecah string URL subpath andalan Anda
   */
  public parseUrlHash(): iRouteState {
    const rawHash = window.location.hash.trim().replace(/^#/, "");
    const persistedTheme = this.normalizeTheme(localStorage.getItem("active_theme"));

    if (!rawHash) {
      const initialState: iRouteState = {
        route: this.defaultRoute,
        theme: persistedTheme || this.currentThemeId || "default",
        fragment: ""
      };
      this.syncAddressBar(initialState, true);
      this.currentThemeId = initialState.theme || this.currentThemeId;
      if (initialState.theme) localStorage.setItem("active_theme", initialState.theme);
      return initialState;
    }

    const [mainPath, ...fragmentParts] = rawHash.split("#");
    const fragment = fragmentParts.join("#").trim().replace(/^#/, "");

      const [routePart, queryString = ""] = mainPath.split("?");
      const query = new URLSearchParams(queryString);
      const queryTheme = query.get("theme");

    let extractedTheme: string | null = queryTheme ? this.normalizeTheme(queryTheme) : null;
    let targetRoute = routePart.trim();

    // Backward compatibility untuk format lama: #theme/route
    if (!queryTheme && targetRoute.includes("/")) {
      const pathParts = targetRoute.split("/");
      if (pathParts.length === 2) {
        extractedTheme = this.normalizeTheme(pathParts[0]);
        targetRoute = pathParts[1];
      }
    }

    const resolvedState: iRouteState = {
      route: this.normalizeRoute(targetRoute),
      theme: extractedTheme || persistedTheme || this.currentThemeId || "default",
      fragment: this.safeDecode(fragment)
    };

    this.currentThemeId = resolvedState.theme || this.currentThemeId;
    if (resolvedState.theme) localStorage.setItem("active_theme", resolvedState.theme);
    this.syncAddressBar(resolvedState, true);

    return resolvedState;
  }

  public normalizeRoute(route: string): string {
    const resolved = route.trim().replace(/^#/, "");
    return resolved || "home";
  }

  private normalizeTheme(theme: string | null | undefined): string {
    return (theme || "").trim().replace(/^#/, "");
  }

  private buildHash(state: iRouteState): string {
    const route = this.normalizeRoute(state.route);
    const theme = this.normalizeTheme(state.theme || this.currentThemeId) || "default";
    const fragment = state.fragment?.trim().replace(/^#/, "");
    const query = `?theme=${encodeURIComponent(theme)}`;
    const fragmentHash = fragment ? `#${fragment}` : "";
    return `#${route}${query}${fragmentHash}`;
  }

  private safeDecode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private syncAddressBar(state: iRouteState, replace = false): void {
    const normalizedHash = this.buildHash(state);
    if (window.location.hash === normalizedHash) return;
    if (replace) {
      window.history.replaceState(null, "", normalizedHash);
    } else {
      window.history.pushState(null, "", normalizedHash);
    }
  }

  /**
   * Pembersih memory leak saat instance dihancurkan
   */
  public destroy(): void {
    window.removeEventListener("hashchange", this._handleHashChange);
  }

  private _handleHashChange = (): void => {
    const state = this.parseUrlHash();
    if (state.theme) this.currentThemeId = state.theme;
    this.onRouteChanged(state);
  };
}

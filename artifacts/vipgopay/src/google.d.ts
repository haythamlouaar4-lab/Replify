declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(cfg: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            ux_mode?: string;
          }): void;
          prompt(cb?: (n: {
            isNotDisplayed(): boolean;
            isSkippedMoment(): boolean;
            isDismissedMoment(): boolean;
          }) => void): void;
          cancel(): void;
        };
        oauth2: {
          initTokenClient(config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }): {
            requestAccessToken(params?: { prompt?: string }): void;
          };
        };
      };
    };
  }
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export {};

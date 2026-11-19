import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Required so Expo can finish and close the browser-based OAuth session.
WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'darzihunar';
const rawDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.trim();
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID?.trim();

function getCognitoIssuer(): string | undefined {
  if (!rawDomain) return undefined;
  const normalized = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
  return normalized.replace(/\/+$/, '');
}

/**
 * For a Development Build / standalone app this resolves to
 * darzihunar://callback when expo.scheme is set to "darzihunar".
 * An explicit env value is supported, but it must exactly match the callback
 * URL allow-listed in the Cognito app client.
 */
function getRedirectUri(): string {
  const configured = process.env.EXPO_PUBLIC_COGNITO_REDIRECT_URI?.trim();
  const generated = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'callback',
  });
  const redirectUri = configured || generated;

  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(redirectUri)) {
    throw new Error(
      `Invalid Google sign-in redirect URI: "${redirectUri}". Set EXPO_PUBLIC_COGNITO_REDIRECT_URI to darzihunar://callback.`,
    );
  }
  return redirectUri;
}

type TokenResponsePayload = {
  id_token?: unknown;
  error?: unknown;
  error_description?: unknown;
};

async function readTokenResponse(response: Response): Promise<TokenResponsePayload> {
  const raw = await response.text();
  try {
    return JSON.parse(raw) as TokenResponsePayload;
  } catch {
    const preview = raw.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(
      `Cognito returned an unexpected token response (HTTP ${response.status}). Check the Cognito domain and OAuth app-client settings. ${preview}`,
    );
  }
}

function explainOAuthError(errorCode: string, detail: string): string {
  switch (errorCode) {
    case 'redirect_mismatch':
    case 'invalid_request':
      return `${detail || 'The OAuth redirect was rejected.'} Confirm that the exact app callback URL is registered in Cognito and matches mobile/.env.`;
    case 'invalid_client':
      return `${detail || 'Cognito rejected the app client.'} Use the Cognito public mobile app-client ID, with no client secret.`;
    case 'unauthorized_client':
      return `${detail || 'This app client is not authorized for OAuth.'} Enable Authorization Code Grant and the Google identity provider on the Cognito app client.`;
    case 'invalid_grant':
      return `${detail || 'The authorization code could not be exchanged.'} Restart Google sign-in and check that the callback URL and PKCE verifier match the original request.`;
    case 'access_denied':
      return 'Google sign-in was denied. Choose an account and allow the requested basic profile permissions.';
    default:
      return detail || errorCode || 'Cognito authorization failed.';
  }
}

export const cognitoAuthService = {
  /**
   * Starts Cognito Hosted UI with Google and exchanges the authorization code
   * using PKCE. Only the Cognito ID token is returned; the backend then verifies
   * it and issues DarziHunar's own API JWT.
   */
  async signInWithGoogle(): Promise<string> {
    const issuer = getCognitoIssuer();
    if (!issuer || !clientId) {
      throw new Error(
        'Google sign-in is not configured. Set EXPO_PUBLIC_COGNITO_DOMAIN and EXPO_PUBLIC_COGNITO_CLIENT_ID in mobile/.env, then restart Expo.',
      );
    }

    const redirectUri = getRedirectUri();
    const discovery: AuthSession.DiscoveryDocument = {
      authorizationEndpoint: `${issuer}/oauth2/authorize`,
      tokenEndpoint: `${issuer}/oauth2/token`,
      revocationEndpoint: `${issuer}/oauth2/revoke`,
    };

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'],
      usePKCE: true,
      extraParams: {
        identity_provider: 'Google',
        prompt: 'select_account',
      },
    });

    let result: Awaited<ReturnType<AuthSession.AuthRequest['promptAsync']>>;
    try {
      result = await request.promptAsync(discovery);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unable to open the sign-in browser.';
      throw new Error(
        `Could not start Google sign-in. ${detail} Check that this is a Development Build with the darzihunar:// scheme registered.`,
      );
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google sign-in was cancelled.');
    }

    if (result.type === 'error') {
      const errorCode = String(result.params?.error ?? result.error?.code ?? '');
      const detail = String(
        result.params?.error_description ?? result.error?.description ?? result.error?.message ?? '',
      );
      throw new Error(
        `${explainOAuthError(errorCode, detail)} App callback for this build: ${redirectUri}`,
      );
    }

    if (result.type !== 'success') {
      throw new Error(`Google sign-in did not complete (result: ${result.type}). App callback: ${redirectUri}`);
    }

    const authorizationCode = result.params?.code;
    if (!authorizationCode) {
      throw new Error(
        `Cognito did not return an authorization code. Check that Authorization Code Grant is enabled. App callback: ${redirectUri}`,
      );
    }

    const codeVerifier = request.codeVerifier;
    if (!codeVerifier) {
      throw new Error('The PKCE verifier was not created. Restart the sign-in flow and verify expo-crypto is installed.');
    }

    const form = [
      ['grant_type', 'authorization_code'],
      ['client_id', clientId],
      ['code', authorizationCode],
      ['redirect_uri', redirectUri],
      ['code_verifier', codeVerifier],
    ]
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    let tokenResponse: Response;
    try {
      tokenResponse = await fetch(`${issuer}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: form,
      });
    } catch {
      throw new Error('Unable to reach the Cognito token endpoint. Check the internet connection and Cognito domain.');
    }

    const payload = await readTokenResponse(tokenResponse);
    if (!tokenResponse.ok) {
      const code = typeof payload.error === 'string' ? payload.error : '';
      const detail = typeof payload.error_description === 'string' ? payload.error_description : '';
      throw new Error(
        `Cognito token exchange failed (HTTP ${tokenResponse.status}): ${explainOAuthError(code, detail)} App callback: ${redirectUri}`,
      );
    }

    if (typeof payload.id_token !== 'string' || !payload.id_token) {
      throw new Error(
        'Cognito did not return an ID token. Enable the openid scope and confirm the authorization-code grant is enabled.',
      );
    }

    return payload.id_token;
  },
};

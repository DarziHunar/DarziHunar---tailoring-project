import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const rawDomain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.trim();
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
const redirectUri = process.env.EXPO_PUBLIC_COGNITO_REDIRECT_URI ||
  AuthSession.makeRedirectUri({ scheme: 'darzihunar', path: 'callback' });

function getCognitoIssuer(): string | undefined {
  if (!rawDomain) return undefined;
  const normalized = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
  return normalized.replace(/\/$/, '');
}

function readTokenResponse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Cognito returned a non-JSON token response. Check the Cognito domain and OAuth app-client configuration. Response: ${raw.slice(0, 240) || '(empty response)'}`);
  }
}

export const cognitoAuthService = {
  async signInWithGoogle(): Promise<string> {
    const issuer = getCognitoIssuer();
    if (!issuer || !clientId) {
      throw new Error('Google sign-in is not configured. Set EXPO_PUBLIC_COGNITO_DOMAIN and EXPO_PUBLIC_COGNITO_CLIENT_ID in mobile/.env.');
    }

    const discovery = await AuthSession.fetchDiscoveryAsync(issuer);
    if (!discovery.authorizationEndpoint || !discovery.tokenEndpoint) {
      throw new Error('Cognito OAuth discovery did not return authorization and token endpoints. Verify the Cognito domain.');
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      scopes: ['openid', 'email', 'profile'],
      usePKCE: true,
      extraParams: { identity_provider: 'Google' },
    });

    const result = await request.promptAsync(discovery);
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Google sign-in was cancelled.');
    }
    if (result.type !== 'success' || !result.params.code) {
      const details = result.type === 'error'
        ? result.error?.message || result.params?.error_description || result.params?.error || 'Cognito authorization failed.'
        : 'Cognito did not return an authorization code.';
      throw new Error(details);
    }
    if (!request.codeVerifier) throw new Error('PKCE verifier was not created. Restart the sign-in flow.');

    // Parse the raw response ourselves so Cognito errors do not become generic JSON Parse errors.
    const form = [
      ['grant_type', 'authorization_code'],
      ['client_id', clientId],
      ['code', result.params.code],
      ['redirect_uri', redirectUri],
      ['code_verifier', request.codeVerifier],
    ].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

    const tokenResponse = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
      body: form,
    });
    const raw = await tokenResponse.text();
    const payload = readTokenResponse(raw);
    if (!tokenResponse.ok) {
      const detail = typeof payload.error_description === 'string'
        ? payload.error_description
        : typeof payload.error === 'string' ? payload.error : `HTTP ${tokenResponse.status}`;
      throw new Error(`Cognito token exchange failed: ${detail}. Check callback URL, authorization-code grant, client ID, and PKCE settings.`);
    }

    const idToken = payload.id_token;
    if (typeof idToken !== 'string' || !idToken) {
      throw new Error('Cognito did not return an ID token. Enable the openid scope and authorization-code grant for this app client.');
    }
    return idToken;
  },
};

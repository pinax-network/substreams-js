export interface Token {
    token: string;
    expires_at: number;
}

export async function authentication_token(api_key: string, url = 'https://auth.streamingfast.io/v1/auth/issue') {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({api_key})
    })
    return response.json() as Promise<Token>;
}

export async function parseAuthorization(authorization: string, url?: string) {
    if ( authorization.includes("server_") ) {
        const { token } = await authentication_token(authorization, url);
        return token;
    }
    return authorization;
}
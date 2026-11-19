export async function apiRequest(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<Response> {
    return fetch(input, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        ...init,
    });
}

export async function apiJson<T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit,
): Promise<T> {
    const res = await apiRequest(input, init);

    if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
            message?: string;
            errors?: Record<string, string[]>;
        };
        const error = new Error(err?.message ?? 'Terjadi kesalahan') as Error & {
            status?: number;
            errors?: Record<string, string[]>;
        };
        error.status = res.status;
        error.errors = err?.errors;
        throw error;
    }

    return res.json();
}

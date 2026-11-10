export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");

function getErrorMessage(payload: any, fallback: string): string {
  const message = payload?.message ?? payload?.error ?? payload?.data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.map((item) => typeof item === "string" ? item : item?.message ?? "").filter(Boolean).join("\n");
  if (message && typeof message === "object") {
    if (typeof message.message === "string") return message.message;
    if (Array.isArray(message.message)) return message.message.join("\n");
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is missing. Add it to mobile/.env and restart Expo.");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new Error(`Unable to reach the DarziHunar API at ${API_BASE_URL}. Check the API URL, network, and backend status.`);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      getErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
    );
  }

  // NestJS ResponseInterceptor wraps successful responses as { success: true, data }.
  return (payload && Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload) as T;
}

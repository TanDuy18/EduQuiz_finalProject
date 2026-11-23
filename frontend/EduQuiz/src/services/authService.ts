import { apiFetch, tokenStore } from "../utils/api";
import type { AuthUser } from "../types/auth";

// Hình dạng dữ liệu mà backend Spring Boot trả về (UserDto và AuthResponse)
interface BackendUser {
    id: number;
    username: string;
    gmail: string;
    avatarUrl: string | null;
    role: "USER" | "LECTURER" | "ADMIN";
    packageOwned: "FREE" | "ONE_WEEK" | "ONE_MONTH" | "ONE_YEAR";
    endDatePackage: string | null;
    freeAccess: number;
}

interface BackendAuthResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: BackendUser;
}

// Đổi tên trường của backend sang tên trường mà giao diện đang dùng (AuthUser)
function toAuthUser(u: BackendUser): AuthUser {
    return {
        id: u.id,
        email: u.gmail,
        name: u.username,
        avatar: u.avatarUrl ?? undefined,
    };
}

export const hasToken = () => tokenStore.get() !== null;

// Gửi ID token (credential) của Google lên backend, lưu token EduQuiz, trả về người dùng
export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
    const res = await apiFetch<BackendAuthResponse>("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
    });
    tokenStore.set(res.accessToken);
    return toAuthUser(res.user);
}

// Hỏi backend "tôi là ai" bằng token đang lưu
export async function knowMe(): Promise<AuthUser> {
    const u = await apiFetch<BackendUser>("/api/v1/auth/me");
    return toAuthUser(u);
}

export function logOut() {
    tokenStore.clear();
}

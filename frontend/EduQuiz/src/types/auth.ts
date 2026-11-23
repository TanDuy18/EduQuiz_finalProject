export interface AuthUser {
    id: number;
    email: string;
    name: string;
    avatar?: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    logout: () => void;
    requireAuth: (action?: () => void) => void;
}

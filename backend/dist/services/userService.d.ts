import { SafeUser, UserStatus } from '../types/index.js';
export declare class UserService {
    /**
     * Search users by username or display name.
     * STRICT PRIVACY INVARIANT: Email addresses are NEVER returned.
     */
    searchUsers(query: string, currentUserId?: string): Promise<SafeUser[]>;
    getUserById(userId: string): Promise<SafeUser | null>;
    getUserByUsername(username: string): Promise<SafeUser | null>;
    updateProfile(userId: string, updates: {
        displayName?: string;
        avatarUrl?: string;
        publicKeyFingerprint?: string;
    }): Promise<SafeUser>;
    updatePresence(userId: string, status: UserStatus): Promise<void>;
}
export declare const userService: UserService;

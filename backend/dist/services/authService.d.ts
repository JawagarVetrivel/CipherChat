import { AuthUser } from '../types/index.js';
export interface RegisterDto {
    email: string;
    password: string;
    username: string;
    displayName: string;
}
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResult {
    user: AuthUser;
    token: string;
}
export declare class AuthService {
    register(dto: RegisterDto): Promise<AuthResult>;
    login(dto: LoginDto): Promise<AuthResult>;
    generateToken(userId: string): string;
    verifyToken(token: string): {
        userId: string;
    };
}
export declare const authService: AuthService;

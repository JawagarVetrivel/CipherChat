import { User, Conversation, EncryptedMessage } from '../types/index.js';
export interface SeedData {
    users: User[];
    conversations: Conversation[];
    messages: EncryptedMessage[];
}
export declare function getSeedData(): Promise<SeedData>;

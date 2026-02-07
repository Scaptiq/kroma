import type { ChatMessage } from "./messageTypes";

export type ChatPlatform = 'twitch' | 'kick' | 'youtube' | 'velora';

export type PlatformTab = ChatPlatform | 'combined';

export const PLATFORM_LABELS: Record<ChatPlatform, string> = {
    twitch: 'Twitch',
    kick: 'Kick',
    youtube: 'YouTube',
    velora: 'Velora',
};

export const PLATFORM_PREFIXES: Record<ChatPlatform, string> = {
    twitch: 'twitch.tv/',
    kick: 'kick.com/',
    youtube: 'youtube.com/@',
    velora: 'velora.tv/',
};

export const PLATFORM_PLACEHOLDERS: Record<ChatPlatform, string> = {
    twitch: 'twitch_username',
    kick: 'kick_username',
    youtube: 'youtube_handle',
    velora: 'velora_username',
};

export const PLATFORM_LOGOS: Record<ChatPlatform, string> = {
    twitch: "https://cdn.brandfetch.io/idIwZCwD2f/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668070397594",
    kick: "data:image/svg+xml;utf8,%3Csvg%20viewBox%3D%220%200%20512%20512%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20stroke-linejoin%3D%22round%22%20stroke-miterlimit%3D%222%22%3E%3Cpath%20d%3D%22M37%20.036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z%22%20fill%3D%22%2353fc18%22/%3E%3C/svg%3E",
    youtube: "https://www.vectorlogo.zone/logos/youtube/youtube-icon.svg",
    velora: "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%202000%202000%22%3E%3Cpath%20d%3D%22M264.28%2C597.95c-18.12-39.02-34.8-77.61-54.45-114.63-29.74-56.02-61.32-111.06-92.59-166.25-10.83-19.11-22.33-37.93-34.82-55.99-23.55-34.02-48.33-67.19-71.96-101.16-7.42-10.66-16.31-22.19-18.26-34.33-3.25-20.22%2C4.81-29.42%2C25.25-29.52%2C51.65-.24%2C103.3%2C1.34%2C154.95%2C2.55%2C15.96.37%2C31.93%2C1.4%2C47.81%2C3.01%2C25.34%2C2.56%2C51.04%2C3.88%2C75.8%2C9.31%2C35.72%2C7.84%2C71.32%2C17.18%2C105.9%2C29.01%2C40.58%2C13.89%2C75.9%2C38.09%2C108.62%2C65.55%2C41.11%2C34.49%2C72.57%2C77.12%2C102.02%2C121.67%2C13.47%2C20.37%2C24.09%2C42.11%2C35.71%2C63.33%2C12.54%2C22.91%2C22.64%2C47.16%2C33.67%2C70.89%2C10.28%2C22.11%2C20.72%2C44.14%2C30.44%2C66.49%2C6.82%2C15.67%2C10.85%2C32.77%2C19.18%2C47.51%2C13.35%2C23.66%2C19.26%2C49.95%2C29.83%2C74.54%2C16.16%2C37.62%2C30.93%2C75.83%2C46.73%2C113.6%2C18.74%2C44.8%2C37.33%2C89.68%2C57.17%2C133.99%2C15.03%2C33.57%2C29.83%2C67.54%2C48.56%2C99.06%2C18.51%2C31.14%2C40.54%2C60.49%2C63.62%2C88.48%2C10.51%2C12.75%2C25.94%2C24.24%2C45.42%2C20.09%2C7.65-1.63%2C19.07-4.62%2C21.08-9.91%2C4.8-12.62%2C17.22-18.44%2C22.09-30.64%2C5.43-13.61%2C13.99-25.93%2C20.28-39.25%2C18.3-38.7%2C37.56-77.03%2C53.85-116.57%2C28.17-68.36%2C53.41-137.93%2C81.68-206.26%2C31.83-76.96%2C65.51-153.16%2C98.69-229.56%2C8.77-20.18%2C18.14-40.15%2C28.15-59.74%2C26.45-51.79%2C58.01-100.23%2C94.93-145.3%2C38.88-47.47%2C85.08-86.41%2C139.15-114.56%2C41.45-21.58%2C86.31-34.37%2C132.66-43.77%2C89.9-18.22%2C180.39-8.02%2C270.58-10.43%2C7.83-.21%2C21.19%2C6.27%2C22.62%2C11.98%2C2.36%2C9.44-.36%2C22.25-5.42%2C31.08-20.65%2C36.03-43.25%2C70.94-64.66%2C106.55-18.35%2C30.53-36.59%2C61.15-53.89%2C92.27-19.6%2C35.26-38.3%2C71.02-57.03%2C106.75-16.78%2C32.03-33.51%2C64.1-49.42%2C96.56-14.04%2C28.67-26.74%2C58-40.34%2C86.9-15.17%2C32.24-30.88%2C64.23-45.99%2C96.5-11.35%2C24.23-21.94%2C48.82-33.2%2C73.09-18.4%2C39.66-37.05%2C79.2-55.63%2C118.78-15.61%2C33.27-31.26%2C66.53-46.9%2C99.8-9.9%2C21.05-19.48%2C42.24-29.78%2C63.09-15.26%2C30.91-30.59%2C61.8-46.68%2C92.27-26.11%2C49.43-50.76%2C99.8-79.89%2C147.41-32.9%2C53.76-67.31%2C107.07-106.15%2C156.59-38.52%2C49.12-81.06%2C95.5-134.17%2C130.57-38.74%2C25.59-79.74%2C46.92-125.66%2C52.65-44.09%2C5.5-88.76%2C3.05-129.2-20.43-21.75-12.63-45.67-22.47-65.06-38.01-25.37-20.33-48.37-43.99-70.28-68.14-25.2-27.77-48.53-57.28-71.81-86.73-12.14-15.36-21.09-33.34-33.85-48.1-20.72-23.97-29.18-55.48-51.01-78.8-7.02-7.5-7.73-20.61-14.1-29.07-19.89-26.46-32.57-56.87-48.09-85.61-30.58-56.62-59.23-114.3-87.65-172.06-20.44-41.54-39.12-83.95-58.74-125.9-7.22-15.43-13.82-31.29-22.56-45.84-10.62-17.69-14.24-37.98-23.51-56.16-10.61-20.83-19.19-42.69-29.09-63.9-8.6-18.42-18.31-36.34-26.61-54.89-8.33-18.61-15.38-37.78-23.27-56.6-4.62-11.02-9.76-21.81-14.77-33.84Z%22%20fill%3D%22%23e2af00%22/%3E%3C/svg%3E",
};

export const getPlatformLabel = (platform: ChatPlatform) => PLATFORM_LABELS[platform];

export const getChannelPrefix = (platform: ChatPlatform) => PLATFORM_PREFIXES[platform];

export const getChannelPlaceholder = (platform: ChatPlatform) => PLATFORM_PLACEHOLDERS[platform];

export const sanitizeChannel = (value: string, platform: ChatPlatform) => {
    if (platform === 'youtube') {
        return value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
    }
    if (platform === 'velora') {
        return value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    return value.toLowerCase().replace(/[^a-z0-9_]/g, '');
};

export const supportsBadges = (platform: ChatPlatform) => platform === 'twitch' || platform === 'kick' || platform === 'youtube';
export const supportsNamePaints = (platform: ChatPlatform) => platform === 'twitch' || platform === 'kick' || platform === 'youtube';
export const supportsRoomState = (platform: ChatPlatform) => platform === 'twitch';
export const supportsHighlights = (platform: ChatPlatform) => platform === 'twitch' || platform === 'youtube' || platform === 'velora';
export const supportsNonVeloraHighlights = (platform: ChatPlatform) => platform === 'twitch' || platform === 'youtube';

export const getMessagePlatform = (msg: ChatMessage, platforms: ChatPlatform[]): ChatPlatform => {
    if (msg.platform) return msg.platform as ChatPlatform;
    if (platforms.length === 1) return platforms[0];
    return 'twitch';
};

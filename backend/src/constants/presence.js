export const ONLINE_USERS_SET = "online:users";
export const ONLINE_TTL_SECONDS = 12 * 60;

export const onlineUserKey = (userId) => `online:${userId}`;

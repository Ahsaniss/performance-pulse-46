import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getAvatarUrl = (avatarPath: string | undefined, name: string) => {
  if (!avatarPath) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
  }
  if (avatarPath.startsWith('http') || avatarPath.startsWith('data:')) {
    return avatarPath;
  }
  // Assuming backend is on localhost:5000
  const baseUrl = 'http://localhost:5000'; 
  return `${baseUrl}${avatarPath}`;
};

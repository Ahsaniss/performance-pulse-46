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
  
  // If path doesn't start with /, add it
  let cleanPath = avatarPath;
  if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  
  // If path doesn't include uploads/ and it's not an external url, assume it's in uploads
  if (!cleanPath.startsWith('/uploads/')) {
    cleanPath = `/uploads${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
};

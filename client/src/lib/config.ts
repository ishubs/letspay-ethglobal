// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const VERIFICATION_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const config = {
  API_BASE_URL,
  VERIFICATION_BASE_URL,
} as const;


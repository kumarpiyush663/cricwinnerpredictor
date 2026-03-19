import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format date to IST display
export function formatDateIST(dateString, options = {}) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };
  
  return date.toLocaleString('en-IN', defaultOptions) + ' IST';
}

// Format date only
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Format time only
export function formatTime(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST';
}

// Check if prediction cutoff has passed
export function isCutoffPassed(matchDateString) {
  if (!matchDateString) return true;
  const matchDate = new Date(matchDateString);
  const now = new Date();
  return now >= matchDate;
}

// Get match status
export function getMatchStatus(match) {
  if (match.status === 'completed') return 'completed';
  if (match.status === 'live') return 'live';
  
  const matchDate = new Date(match.start_datetime_ist);
  const now = new Date();
  
  if (now >= matchDate) return 'live';
  return 'upcoming';
}

// Get status badge classes
export function getStatusBadgeClasses(status) {
  switch (status) {
    case 'live':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'upcoming':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'completed':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

// Calculate time until match
export function getTimeUntilMatch(matchDateString) {
  if (!matchDateString) return null;
  
  const matchDate = new Date(matchDateString);
  const now = new Date();
  const diff = matchDate - now;
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Validate password
export function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('One special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get rank badge style
export function getRankStyle(rank) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900';
    case 2:
      return 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900';
    case 3:
      return 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-900';
    default:
      return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
  }
}

// Truncate text
export function truncate(str, length = 30) {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// Generate avatar initials
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

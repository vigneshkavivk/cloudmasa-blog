import { UserRole } from '../types';

/**
 * Generates a human-readable User ID: USR-{YYYY}-{NNN}
 * In a real Firestore app, this would use a transaction to increment a global counter.
 * Here we simulate it with a random number for client-side demo purposes.
 */
export const generateUserId = (): string => {
  const year = new Date().getFullYear();
  // Simulate 3 digit counter
  const counter = Math.floor(Math.random() * 900) + 100; 
  return `USR-${year}-${counter}`;
};

export const generateServiceId = (prefix: string): string => {
  const year = new Date().getFullYear();
  const counter = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${counter}`;
};

// --- Permission Helpers ---

export const canInvite = (currentUserRole: UserRole): boolean => {
  return (
    currentUserRole === UserRole.SUPERADMIN || 
    currentUserRole === UserRole.ADMIN
  );
};

export const canViewAdminPanel = (currentUserRole: UserRole): boolean => {
    // Strictly for User Management (Invite/Edit/Delete)
    return (
      currentUserRole === UserRole.SUPERADMIN || 
      currentUserRole === UserRole.ADMIN
    );
};

export const canAccessServiceHub = (currentUserRole: UserRole): boolean => {
    // Support needs to view service analytics/catalog but not manage users
    return (
        currentUserRole === UserRole.SUPERADMIN || 
        currentUserRole === UserRole.ADMIN ||
        currentUserRole === UserRole.SUPPORT || // Added Support
        currentUserRole === UserRole.CUSTOMER
    );
};

export const canViewSensitiveStats = (currentUserRole: UserRole): boolean => {
    // Restrict Revenue, Payroll, and detailed User Stats to Admins only
    return (
        currentUserRole === UserRole.SUPERADMIN || 
        currentUserRole === UserRole.ADMIN
    );
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Generates a fully qualified frontend URL for the invite.
 * Uses window.location.origin to ensure it works on localhost and production (e.g. web.app)
 * without pointing to cloud function URLs.
 */
export const generateInviteLink = (token: string): string => {
  const origin = window.location.origin;
  // Assumes HashRouter usage and maps to /register
  return `${origin}/#/register?token=${token}`;
};
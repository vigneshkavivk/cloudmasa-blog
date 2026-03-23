// ======================
// Enums
// ======================

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SUPPORT = 'support',
  CUSTOMER = 'customer',
}

export type UserStatus = 'active' | 'invited' | 'blocked' | 'accepted';

// ======================
// Interfaces
// ======================

export interface UserProfile {
  uid: string;
  email?: string;               // For email-based login (admins/support)
  phoneNumber?: string;         // For OTP-based login (customers)
  userId: string;               // e.g., USR-2026-001
  role: UserRole;
  status: UserStatus;
  displayName: string;
  company?: string;             // Optional — for profile completion
  isExpert?: boolean;           // Optional — for consultation visibility
  createdAt: number;            // Timestamp (ms)
  invitedBy?: string;           // UID of inviter (admin/superadmin)
  invitedAt?: number;           // Timestamp of invitation
}

export interface Folder {
  id: string;                   // 'personal', 'regibiz', or custom UUID
  name: string;
  type: 'system' | 'custom';
  userId: string;
  createdAt: number;
}

export interface ServiceDocument {
  id: string;                   // DOC-{timestamp}
  type: 'gst' | 'pan' | 'trademark' | 'fssai' | 'msme' | 'note' | 'file' | 'legal';
  subtype?: string;             // e.g., 'nda', 'mou' (for legal/docs)
  title: string;
  serviceId?: string;           // e.g., GST-2026-089 (optional for notes/files)
  status?: 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid'; // optional for non-service docs
  submittedAt: number;          // Timestamp (ms)
  formData?: Record<string, any>; // Form answers (for services)
  userId: string;               // Owner UID
  amount?: number;              // Fee paid (for paid services)

  // Vault & File Management
  folderId: string;             // Required: 'personal', 'regibiz', or custom folder ID
  content?: string;             // For notes or generated legal text
  size?: string;                // e.g., "2.4 MB"
  fileType?: string;            // e.g., "pdf", "jpg", "docx"
}

export interface Invite {
  token: string;                // Unique invite token
  email: string;                // Required for admin/support invites
  phoneNumber?: string;         // Optional — may be used for customer invites in future
  role: UserRole;
  invitedBy: string;            // UID of inviting admin
  expiresAt: number;            // Expiry timestamp (ms)
  createdAt: number;            // Creation timestamp (ms)
  used: boolean;                // Has the invite been accepted?
}

export interface Notification {
  id: string;                   // Unique notification ID
  userId: string;               // Recipient UID
  title: string;                // Short headline
  body: string;                 // Descriptive subtitle or message
  type: 'document' | 'reminder' | 'system';
  read: boolean;
  createdAt: number;            // Timestamp (ms)
  redirectUrl?: string;         // e.g., "/documents?id=DOC-123"
  serviceId?: string;           // Contextual ID (e.g., GST-2026-089)
}
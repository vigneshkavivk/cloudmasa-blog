import { UserProfile, UserRole, UserStatus, ServiceDocument, Folder, Invite, Notification } from '../types';
import { generateUserId } from '../utils/helpers';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';

// ─── Predefined System Users ───────────────────────────────────────────
const PREDEFINED_SYSTEM_USERS = [
  {
    email: 'keerthana.s@cloudmasa.com',
    role: UserRole.SUPERADMIN,
    displayName: 'Keerthana S',
  },
  {
    email: 'support@cloudmasa.com',
    role: UserRole.ADMIN,
    displayName: 'System Admin',
  },
  {
    email: 'info@cloudmasa.com',
    role: UserRole.SUPPORT,
    displayName: 'Support Staff',
  },
];

// ─── Auth Service ──────────────────────────────────────────────────────
export const mockAuthService = {
  loginWithEmail: async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error('Password is required');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await mockAuthService._handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const predefinedUser = PREDEFINED_SYSTEM_USERS.find((u) => u.email === email);
        if (predefinedUser) {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser: UserProfile = {
              uid: userCredential.user.uid,
              email: email,
              displayName: predefinedUser.displayName,
              role: predefinedUser.role,
              status: 'active',
              userId: `USR-SYS-${Math.floor(Math.random() * 1000)}`,
              createdAt: Date.now(),
              isExpert: true,
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            return newUser;
          } catch (createErr) {
            console.error('Failed to auto-create system user', createErr);
            throw error;
          }
        }
      }

      if (
        error.code === 'auth/invalid-credential' ||
        error.message.includes('password') ||
        error.code === 'auth/wrong-password'
      ) {
        throw new Error('Invalid credentials.');
      }
      throw error;
    }
  },

  _handleAuthSuccess: async (fbUser: any): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', fbUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const dbUser = userDocSnap.data() as UserProfile;
      if (dbUser.status === 'blocked') throw new Error('Account has been deactivated. Contact admin.');
      return dbUser;
    }

    const predefinedUser = PREDEFINED_SYSTEM_USERS.find((u) => u.email === fbUser.email);
    if (predefinedUser) {
      const newUser: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: predefinedUser.displayName,
        role: predefinedUser.role,
        status: 'active',
        userId: `USR-SYS-${Math.floor(Math.random() * 1000)}`,
        createdAt: Date.now(),
        isExpert: true,
      };
      await setDoc(userDocRef, newUser);
      return newUser;
    }

    return {
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName: fbUser.displayName || 'User',
      role: UserRole.CUSTOMER,
      status: 'active',
      userId: `USR-${fbUser.uid.substring(0, 6).toUpperCase()}`,
      createdAt: Date.now(),
    };
  },

  registerWithEmail: async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      const newUser: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        displayName,
        role: UserRole.CUSTOMER,
        status: 'active',
        userId: generateUserId(),
        createdAt: Date.now(),
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      await signOut(auth);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists.');
      }
      throw error;
    }
  },

  loginWithGoogle: async (): Promise<UserProfile> => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return await mockAuthService._handleAuthSuccess(result.user);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to login with Google');
    }
  },

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: (): UserProfile | null => {
    const user = auth.currentUser;
    return user
      ? {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          role: UserRole.CUSTOMER,
          status: 'active',
          userId: '',
          createdAt: 0,
        }
      : null;
  },

  subscribeToAuth: (callback: (user: UserProfile | null) => void) => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribeProfile = onSnapshot(
            userDocRef,
            (docSnap) => {
              if (docSnap.exists()) {
                callback(docSnap.data() as UserProfile);
              } else {
                callback({
                  uid: user.uid,
                  email: user.email || '',
                  displayName: user.displayName || 'User',
                  role: UserRole.CUSTOMER,
                  status: 'active',
                  userId: 'USR-TEMP',
                  createdAt: Date.now(),
                });
              }
            },
            (error) => {
              console.warn('Auth profile snapshot error:', error.code);
            }
          );
        } catch (e) {
          console.error('Auth subscription error', e);
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  },

  // ✅ FIXED: Filter out undefined values before updating
  updateUserProfile: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
    if (uid.startsWith('phone_')) return;
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    let newStatus = undefined;
    if (userSnap.exists()) {
      const currentUserData = userSnap.data() as UserProfile;
      if (currentUserData.status === 'accepted' && (data.phoneNumber || data.company)) {
        newStatus = 'active';
      }
    }
    
    // ✅ Filter out undefined values (Firebase doesn't allow undefined)
    const updateData: Record<string, any> = { ...data };
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await updateDoc(userDocRef, {
      ...updateData,
      ...(newStatus ? { status: newStatus } : {}),
    });
    if (data.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: data.displayName });
    }
  },

  resetPassword: async (email: string) => {
    console.log('Reset password for:', email);
  },

  resendVerification: async () => {
    console.log('Resend email verification');
  },

  loginWithPhone: async (phone: string, otp: string) => {
    return {
      uid: `phone_${phone}`,
      phoneNumber: phone,
      displayName: 'Mobile User',
      role: UserRole.CUSTOMER,
      status: 'active',
      userId: generateUserId(),
      createdAt: Date.now(),
    } as UserProfile;
  },
};

// ─── DB Service ────────────────────────────────────────────────────────
export const mockDbService = {
  // ── Folders ──────────────────────────────────────────────────────────
  getFolders: async (uid: string): Promise<Folder[]> => {
    if (uid.startsWith('phone_')) return [];
    try {
      const foldersRef = collection(db, 'users', uid, 'folders');
      const snap = await getDocs(foldersRef);
      let userFolders: Folder[] = [];
      snap.forEach((doc) => userFolders.push(doc.data() as Folder));

      const systemFolderNames = ['regibiz', 'personal'];
      for (const name of systemFolderNames) {
        if (!userFolders.find((f) => f.id === name)) {
          const newFolder: Folder = {
            id: name,
            name: name === 'regibiz' ? 'RegiBIZ' : 'Personal',
            type: 'system',
            userId: uid,
            createdAt: Date.now(),
          };
          await setDoc(doc(db, 'users', uid, 'folders', name), newFolder);
          userFolders.push(newFolder);
        }
      }
      return userFolders;
    } catch (e) {
      console.error('Error fetching folders:', e);
      return [];
    }
  },

  createFolder: async (name: string, uid: string): Promise<Folder> => {
    if (uid.startsWith('phone_')) throw new Error('Mock users cannot create folders');
    const id = `folder-${Date.now()}`;
    const newFolder: Folder = {
      id,
      name,
      type: 'custom',
      userId: uid,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, 'users', uid, 'folders', id), newFolder);
    return newFolder;
  },

  renameFolder: async (folderId: string, newName: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No user logged in');
    if (folderId === 'regibiz' || folderId === 'personal') throw new Error('Cannot rename system folders');
    await updateDoc(doc(db, 'users', uid, 'folders', folderId), { name: newName });
  },

  deleteFolder: async (folderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No user logged in');
    if (folderId === 'regibiz' || folderId === 'personal') throw new Error('Cannot delete system folders');
    const docsRef = collection(db, 'users', uid, 'documents');
    const q = query(docsRef, where('folderId', '==', folderId));
    const snap = await getDocs(q);
    const batchPromises = snap.docs.map((d) => updateDoc(d.ref, { folderId: 'personal' }));
    await Promise.all(batchPromises);
    await deleteDoc(doc(db, 'users', uid, 'folders', folderId));
  },

  // ── Documents ────────────────────────────────────────────────────────
  getDocuments: async (uid: string): Promise<ServiceDocument[]> => {
    if (uid.startsWith('phone_')) return [];
    const docsRef = collection(db, 'users', uid, 'documents');
    const snap = await getDocs(docsRef);
    let docs: ServiceDocument[] = [];
    snap.forEach((doc) => docs.push(doc.data() as ServiceDocument));
    return docs;
  },

  getAllDocuments: async (): Promise<{ doc: ServiceDocument; user: UserProfile }[]> => {
    try {
      const appsRef = collection(db, 'applications');
      const appSnap = await getDocs(appsRef);
      if (!appSnap.empty) {
        const users = await mockDbService.getAllUsers();
        const userMap = new Map(users.map((u) => [u.uid, u]));
        const allDocs: { doc: ServiceDocument; user: UserProfile }[] = [];
        appSnap.forEach((d) => {
          const docData = d.data() as ServiceDocument;
          const docUser = userMap.get(docData.userId);
          if (docUser) {
            allDocs.push({ doc: docData, user: docUser });
          }
        });
        return allDocs;
      }
      return [];
    } catch (e) {
      console.error('Error fetching all docs:', e);
      return [];
    }
  },

  subscribeToAllApplications: (callback: (docs: ServiceDocument[]) => void) => {
    const q = query(collection(db, 'applications'));
    return onSnapshot(
      q,
      (snapshot) => {
        const docs: ServiceDocument[] = [];
        snapshot.forEach((d) => docs.push(d.data() as ServiceDocument));
        callback(docs);
      },
      (error) => {
        console.warn('Application subscription error:', error);
      }
    );
  },

  createDocument: async (document: ServiceDocument): Promise<void> => {
    if (document.userId.startsWith('phone_')) return;

    await setDoc(doc(db, 'users', document.userId, 'documents', document.id), document);

    if (document.type !== 'note' && document.type !== 'file') {
      await setDoc(doc(db, 'applications', document.id), document);
    }

    if (document.status === 'paid' || document.status === 'submitted') {
      const notifId = `notif-${Date.now()}`;
      const notification: Notification = {
        id: notifId,
        userId: document.userId,
        title: 'Document Submitted',
        body: `${document.title} has been successfully submitted.`,
        type: 'document',
        read: false,
        createdAt: Date.now(),
        serviceId: document.serviceId,
        redirectUrl: `/documents?id=${document.id}`,
      };
      await setDoc(doc(db, 'users', document.userId, 'notifications', notifId), notification);
    }
  },

  updateDocumentStatus: async (docId: string, userId: string, status: string, notes?: string): Promise<void> => {
    const batch = writeBatch(db);

    batch.update(doc(db, 'users', userId, 'documents', docId), { status });
    batch.set(doc(db, 'applications', docId), { status }, { merge: true });

    const notifId = `notif-${Date.now()}`;
    let title = 'Status Update';
    let body = `Your application status has changed to ${status}.`;
    if (status === 'approved') {
      title = 'Application Approved';
      body = 'Congratulations! Your application has been processed and approved.';
    } else if (status === 'processing') {
      title = 'Under Review';
      body = 'Our team is currently reviewing your application.';
    }
    if (notes) body += ` Note: ${notes}`;

    const notification: Notification = {
      id: notifId,
      userId,
      title,
      body,
      type: 'system',
      read: false,
      createdAt: Date.now(),
      redirectUrl: `/documents?id=${docId}`,
    };
    batch.set(doc(db, 'users', userId, 'notifications', notifId), notification);

    await batch.commit();
  },

  moveDocument: async (docId: string, targetFolderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No user logged in');
    await updateDoc(doc(db, 'users', uid, 'documents', docId), { folderId: targetFolderId });
  },

  copyDocument: async (docId: string, targetFolderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No user logged in');
    const originalSnap = await getDoc(doc(db, 'users', uid, 'documents', docId));
    if (originalSnap.exists()) {
      const original = originalSnap.data() as ServiceDocument;
      const newId = `DOC-${Date.now()}`;
      const newDoc: ServiceDocument = {
        ...original,
        id: newId,
        folderId: targetFolderId,
        title: `${original.title} (Copy)`,
        submittedAt: Date.now(),
      };
      await setDoc(doc(db, 'users', uid, 'documents', newId), newDoc);
    }
  },

  deleteDocument: async (docId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No user logged in');
    await deleteDoc(doc(db, 'users', uid, 'documents', docId));
    try {
      await deleteDoc(doc(db, 'applications', docId));
    } catch (e) {
      /* ignore */
    }
  },

  // ── Notifications ────────────────────────────────────────────────────
  subscribeToNotifications: (uid: string, callback: (notifs: Notification[]) => void) => {
    if (!uid || uid.startsWith('phone_')) {
      callback([]);
      return () => {};
    }
    const notifRef = collection(db, 'users', uid, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach((doc) => notifs.push(doc.data() as Notification));
        callback(notifs);
      },
      (error) => {
        console.warn('Notification snapshot error:', error.message);
      }
    );
  },

  getNotifications: async (uid: string): Promise<Notification[]> => {
    if (uid.startsWith('phone_')) return [];
    const notifRef = collection(db, 'users', uid, 'notifications');
    const snap = await getDocs(notifRef);
    let notifs: Notification[] = [];
    snap.forEach((doc) => notifs.push(doc.data() as Notification));
    return notifs.sort((a, b) => b.createdAt - a.createdAt);
  },

  markNotificationRead: async (uid: string, notifId: string): Promise<void> => {
    if (uid.startsWith('phone_')) return;
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { read: true });
  },

  markAllNotificationsRead: async (uid: string): Promise<void> => {
    if (uid.startsWith('phone_')) return;
    const notifRef = collection(db, 'users', uid, 'notifications');
    const q = query(notifRef, where('read', '==', false));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  },

  // ── User & Invite Management ─────────────────────────────────────────
  getAllUsers: async (): Promise<UserProfile[]> => {
    let users: UserProfile[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      querySnapshot.forEach((doc) => users.push(doc.data() as UserProfile));
    } catch (e) {
      console.warn('Permission denied listing users. Returning empty list.', e);
      return [];
    }
    try {
      const invitesSnapshot = await getDocs(collection(db, 'invites'));
      invitesSnapshot.forEach((d) => {
        const inv = d.data() as Invite;
        if (!inv.used) {
          users.push({
            uid: `pending_${d.id}`,
            email: inv.email,
            displayName: 'Invited User',
            role: inv.role,
            status: 'invited',
            userId: 'PENDING',
            createdAt: inv.createdAt,
            invitedBy: inv.invitedBy,
            invitedAt: inv.createdAt,
          });
        }
      });
    } catch (e) {
      console.warn('Could not fetch invites:', e);
    }
    return users;
  },

  subscribeToCustomers: (callback: (users: UserProfile[]) => void) => {
    const q = query(collection(db, 'users'), where('role', '==', UserRole.CUSTOMER));
    return onSnapshot(
      q,
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((doc) => users.push(doc.data() as UserProfile));
        callback(users);
      },
      (error) => {
        console.warn('Customer subscription error:', error);
        callback([]);
      }
    );
  },

  // ✅ Create User Directly (Admin Function)
  createUser: async (userData: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
    invitedBy?: string;
  }): Promise<UserProfile> => {
    const userQ = query(collection(db, 'users'), where('email', '==', userData.email));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) {
      throw new Error('User already exists with this email.');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      const newUserProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: 'active',
        userId: generateUserId(),
        createdAt: Date.now(),
        invitedBy: userData.invitedBy,
        isTemporaryPassword: true,
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), newUserProfile);
      await signOut(auth);
      return newUserProfile;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists.');
      }
      throw error;
    }
  },

  // ✅ Change Password (User Function)
  changePassword: async (uid: string, oldPassword: string, newPassword: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isTemporaryPassword: false,
    });

    if (auth.currentUser) {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email || '',
        oldPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    }
  },

  inviteUser: async (email: string, role: UserRole, invitedByUid: string): Promise<string> => {
    const userQ = query(collection(db, 'users'), where('email', '==', email));
    const userSnap = await getDocs(userQ);
    if (!userSnap.empty) throw new Error('User already exists with this email.');

    const inviteQ = query(collection(db, 'invites'), where('email', '==', email), where('used', '==', false));
    const inviteSnap = await getDocs(inviteQ);
    if (!inviteSnap.empty) throw new Error('Invite already pending for this email.');

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invite: Invite = {
      token,
      email,
      role,
      invitedBy: invitedByUid,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      used: false,
    };
    await setDoc(doc(db, 'invites', token), invite);
    return token;
  },

  resendInvite: async (oldToken: string): Promise<void> => {
    const inviteRef = doc(db, 'invites', oldToken);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invite not found or already deleted.');
    const oldInvite = inviteSnap.data() as Invite;
    await deleteDoc(inviteRef);
    await mockDbService.inviteUser(oldInvite.email, oldInvite.role, oldInvite.invitedBy);
  },

  validateInviteToken: async (token: string): Promise<Invite> => {
    const inviteRef = doc(db, 'invites', token);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invalid invite link.');
    const invite = inviteSnap.data() as Invite;
    if (invite.used) throw new Error('This invite has already been used.');
    if (invite.expiresAt < Date.now()) throw new Error('Invite link expired.');
    return invite;
  },

  acceptInvite: async (token: string, password: string, displayName: string): Promise<void> => {
    const invite = await mockDbService.validateInviteToken(token);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, invite.email, password);
      await updateProfile(userCredential.user, { displayName });
      const newUserProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: invite.email,
        displayName,
        role: invite.role,
        status: 'accepted',
        userId: generateUserId(),
        createdAt: Date.now(),
        invitedBy: invite.invitedBy,
        invitedAt: invite.createdAt,
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newUserProfile);
      await updateDoc(doc(db, 'invites', token), { used: true });
      await signOut(auth);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        throw new Error('Account already exists. Please login.');
      }
      throw e;
    }
  },

  updateUserRole: async (targetUid: string, newRole: UserRole): Promise<void> => {
    const userRef = doc(db, 'users', targetUid);
    await updateDoc(userRef, { role: newRole });
  },

  toggleUserBlock: async (targetUid: string, currentStatus: UserStatus): Promise<void> => {
    const userRef = doc(db, 'users', targetUid);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await updateDoc(userRef, { status: newStatus });
  },

  deactivateUser: async (targetUid: string): Promise<void> => {
    try {
      if (targetUid.startsWith('pending_')) {
        const token = targetUid.replace('pending_', '');
        await deleteDoc(doc(db, 'invites', token));
      } else {
        const userRef = doc(db, 'users', targetUid);
        await updateDoc(userRef, { status: 'blocked' });
      }
    } catch (error: any) {
      console.error('Deactivate failed in service:', error);
      throw error;
    }
  },

  deleteSystemUser: async (uid: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      console.error('Failed to delete user data:', error);
      throw new Error('System deletion failed');
    }
  },

  toggleExpertStatus: async (uid: string, isExpert: boolean): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), { isExpert });
  },
};
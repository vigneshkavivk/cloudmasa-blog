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
  signInWithPopup
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
  addDoc,
  orderBy,
  onSnapshot,
  writeBatch,
  collectionGroup
} from 'firebase/firestore';

const SUPERADMIN_EMAIL = 'keerthana.s@cloudmasa.com';

// --- Auth Service ---

export const mockAuthService = {
  // Login with Email & Password
  loginWithEmail: async (email: string, password?: string): Promise<UserProfile> => {
    if (!password) throw new Error("Password is required");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return await mockAuthService._handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      // FIX: Only attempt creation if user strictly NOT found. 
      // 'auth/invalid-credential' means wrong password for existing email -> do NOT try to create.
      if (error.code === 'auth/user-not-found' && email === SUPERADMIN_EMAIL) {
          try {
             const userCredential = await createUserWithEmailAndPassword(auth, email, password);
             const superUser: UserProfile = {
                uid: userCredential.user.uid,
                email: email,
                displayName: 'Keerthana S',
                role: UserRole.SUPERADMIN,
                status: 'active',
                userId: 'USR-ADMIN-001',
                createdAt: Date.now(),
                isExpert: true
             };
             await setDoc(doc(db, 'users', userCredential.user.uid), superUser);
             return superUser;
          } catch (createErr) {
             console.error("Failed to auto-create superadmin", createErr);
             throw error; 
          }
      }

      if (error.code === 'auth/invalid-credential' || error.message.includes('password') || error.code === 'auth/wrong-password') {
        throw new Error("Invalid credentials.");
      }
      throw error;
    }
  },

  _handleAuthSuccess: async (fbUser: any): Promise<UserProfile> => {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const dbUser = userDocSnap.data() as UserProfile;
        if (dbUser.status === 'blocked') throw new Error("Account has been deactivated. Contact admin.");
        return dbUser;
      }
      
      if (fbUser.email === SUPERADMIN_EMAIL) {
        const superUser: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: 'Keerthana S',
          role: UserRole.SUPERADMIN,
          status: 'active',
          userId: 'USR-ADMIN-001',
          createdAt: Date.now(),
          isExpert: true
        };
        await setDoc(userDocRef, superUser);
        return superUser;
      }

      return {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || 'User',
        role: UserRole.CUSTOMER,
        status: 'active',
        userId: 'USR-' + fbUser.uid.substring(0, 6).toUpperCase(),
        createdAt: Date.now()
      };
  },

  registerWithEmail: async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      const newUser: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName,
        role: UserRole.CUSTOMER,
        status: 'active',
        userId: generateUserId(),
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
      await signOut(auth);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("User already exists.");
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
      throw new Error(error.message || "Failed to login with Google");
    }
  },

  // Removed Github Login logic entirely

  logout: async () => {
    await signOut(auth);
  },

  getCurrentUser: (): UserProfile | null => {
     const user = auth.currentUser;
     return user ? { 
        uid: user.uid, 
        email: user.email || '', 
        displayName: user.displayName || '', 
        role: UserRole.CUSTOMER, 
        status: 'active', 
        userId: '', 
        createdAt: 0 
     } : null; 
  },

  subscribeToAuth: (callback: (user: UserProfile | null) => void) => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous profile listener if exists to prevent permission errors on logout
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          // Real-time listener for user profile updates
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  callback(docSnap.data() as UserProfile);
              } else {
                  // Handle edge case where doc doesn't exist yet
                  callback({
                    uid: user.uid,
                    email: user.email || '',
                    displayName: user.displayName || 'User',
                    role: UserRole.CUSTOMER,
                    status: 'active',
                    userId: 'USR-TEMP',
                    createdAt: Date.now()
                 });
              }
          }, (error) => {
             // Suppress permission errors during logout race conditions
             console.warn("Auth profile snapshot error:", error.code);
          });
        } catch (e) {
          console.error("Auth subscription error", e);
          callback(null);
        }
      } else {
        callback(null);
      }
    });

    // Return a function that unsubscribes both
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  },

  updateUserProfile: async (uid: string, data: Partial<UserProfile>): Promise<void> => {
      // Guard for mock users
      if (uid.startsWith('phone_')) return;

      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      
      let newStatus = undefined;
      if (userSnap.exists()) {
         const currentUserData = userSnap.data() as UserProfile;
         // If user is 'accepted' and completing profile (adding phone or company), promote to 'active'
         if (currentUserData.status === 'accepted' && (data.phoneNumber || data.company)) {
            newStatus = 'active';
         }
      }

      await updateDoc(userDocRef, { 
        ...data,
        ...(newStatus ? { status: newStatus } : {})
      });
      
      if (data.displayName && auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: data.displayName });
      }
  },

  resetPassword: async (email: string) => { console.log("Reset", email); },
  resendVerification: async () => { console.log("Resend"); },
  loginWithPhone: async (phone: string, otp: string) => {
      return {
          uid: 'phone_' + phone,
          phoneNumber: phone,
          displayName: 'Mobile User',
          role: UserRole.CUSTOMER,
          status: 'active',
          userId: generateUserId(),
          createdAt: Date.now()
      } as UserProfile;
  }
};

// --- DB Service ---

export const mockDbService = {
  // --- Folders (Firestore) ---
  getFolders: async (uid: string): Promise<Folder[]> => {
    if (uid.startsWith('phone_')) return []; // Return empty for mock users

    try {
      const foldersRef = collection(db, 'users', uid, 'folders');
      const snap = await getDocs(foldersRef);
      let userFolders: Folder[] = [];
      snap.forEach(doc => userFolders.push(doc.data() as Folder));

      // Seed system folders if not present
      const systemFolderNames = ['regibiz', 'personal'];
      for (const name of systemFolderNames) {
        if (!userFolders.find(f => f.id === name)) {
          const newFolder: Folder = {
            id: name,
            name: name === 'regibiz' ? 'RegiBIZ' : 'Personal',
            type: 'system',
            userId: uid,
            createdAt: Date.now()
          };
          await setDoc(doc(db, 'users', uid, 'folders', name), newFolder);
          userFolders.push(newFolder);
        }
      }
      return userFolders;
    } catch (e) {
      console.error("Error fetching folders:", e);
      return [];
    }
  },

  createFolder: async (name: string, uid: string): Promise<Folder> => {
    if (uid.startsWith('phone_')) throw new Error("Mock users cannot create folders");
    
    const id = `folder-${Date.now()}`;
    const newFolder: Folder = {
      id,
      name,
      type: 'custom',
      userId: uid,
      createdAt: Date.now()
    };
    await setDoc(doc(db, 'users', uid, 'folders', id), newFolder);
    return newFolder;
  },

  renameFolder: async (folderId: string, newName: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("No user logged in");
    
    // Safety check for system folders
    if (folderId === 'regibiz' || folderId === 'personal') throw new Error("Cannot rename system folders");

    await updateDoc(doc(db, 'users', uid, 'folders', folderId), { name: newName });
  },

  deleteFolder: async (folderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("No user logged in");

    if (folderId === 'regibiz' || folderId === 'personal') throw new Error("Cannot delete system folders");

    // Move docs to personal
    const docsRef = collection(db, 'users', uid, 'documents');
    const q = query(docsRef, where("folderId", "==", folderId));
    const snap = await getDocs(q);
    
    const batchPromises = snap.docs.map(d => updateDoc(d.ref, { folderId: 'personal' }));
    await Promise.all(batchPromises);

    await deleteDoc(doc(db, 'users', uid, 'folders', folderId));
  },

  // --- Documents (Firestore) ---
  getDocuments: async (uid: string): Promise<ServiceDocument[]> => {
    if (uid.startsWith('phone_')) return []; // Return empty for mock users

    const docsRef = collection(db, 'users', uid, 'documents');
    const snap = await getDocs(docsRef);
    let docs: ServiceDocument[] = [];
    snap.forEach(doc => docs.push(doc.data() as ServiceDocument));
    return docs;
  },

  // NEW: Fetch all documents for Admin/Support dashboards
  getAllDocuments: async (): Promise<{doc: ServiceDocument, user: UserProfile}[]> => {
    try {
        // Since it's a mock setup with subcollections, we iterate users.
        // In real scalable Firestore, you'd use collectionGroup('documents')
        const users = await mockDbService.getAllUsers();
        const allDocs: {doc: ServiceDocument, user: UserProfile}[] = [];

        for (const user of users) {
             // Skip pending invites or incomplete users
             if(user.uid.startsWith('pending_') || !user.uid) continue;

             try {
                const docsRef = collection(db, 'users', user.uid, 'documents');
                const snap = await getDocs(docsRef);
                snap.forEach(d => {
                    allDocs.push({
                        doc: d.data() as ServiceDocument,
                        user: user
                    });
                });
             } catch(e) {
                 // Ignore permission errors for mock data consistency
             }
        }
        return allDocs;
    } catch (e) {
        console.error("Error fetching all docs:", e);
        return [];
    }
  },

  createDocument: async (document: ServiceDocument): Promise<void> => {
    if (document.userId.startsWith('phone_')) return; // No-op for mock users

    await setDoc(doc(db, 'users', document.userId, 'documents', document.id), document);
    
    // Trigger Notification for new submission
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
           redirectUrl: `/documents?id=${document.id}`
       };
       await setDoc(doc(db, 'users', document.userId, 'notifications', notifId), notification);
    }
  },

  // NEW: Update Document Status (for Admin/Support)
  updateDocumentStatus: async (docId: string, userId: string, status: string, notes?: string): Promise<void> => {
      const docRef = doc(db, 'users', userId, 'documents', docId);
      await updateDoc(docRef, { status: status });

      // Send notification to customer
      const notifId = `notif-${Date.now()}`;
      let title = "Status Update";
      let body = `Your application status has changed to ${status}.`;
      
      if (status === 'approved') {
          title = "Application Approved";
          body = "Congratulations! Your application has been processed and approved.";
      } else if (status === 'processing') {
          title = "Under Review";
          body = "Our team is currently reviewing your application.";
      }

      if (notes) body += ` Note: ${notes}`;

      const notification: Notification = {
           id: notifId,
           userId: userId,
           title: title,
           body: body,
           type: 'system',
           read: false,
           createdAt: Date.now(),
           redirectUrl: `/documents?id=${docId}`
       };
       await setDoc(doc(db, 'users', userId, 'notifications', notifId), notification);
  },

  moveDocument: async (docId: string, targetFolderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("No user logged in");
    await updateDoc(doc(db, 'users', uid, 'documents', docId), { folderId: targetFolderId });
  },

  copyDocument: async (docId: string, targetFolderId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("No user logged in");
    
    const originalSnap = await getDoc(doc(db, 'users', uid, 'documents', docId));
    if (originalSnap.exists()) {
      const original = originalSnap.data() as ServiceDocument;
      const newId = `DOC-${Date.now()}`;
      const newDoc: ServiceDocument = {
        ...original,
        id: newId,
        folderId: targetFolderId,
        title: `${original.title} (Copy)`,
        submittedAt: Date.now()
      };
      await setDoc(doc(db, 'users', uid, 'documents', newId), newDoc);
    }
  },

  deleteDocument: async (docId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("No user logged in");
    await deleteDoc(doc(db, 'users', uid, 'documents', docId));
  },

  // --- Notifications (Real-time Firestore) ---
  
  subscribeToNotifications: (uid: string, callback: (notifs: Notification[]) => void) => {
    // Prevent permission denied errors for mock users (phone login)
    if (!uid || uid.startsWith('phone_')) {
        callback([]);
        return () => {};
    }

    const notifRef = collection(db, "users", uid, "notifications");
    const q = query(notifRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const notifs: Notification[] = [];
        snapshot.forEach(doc => notifs.push(doc.data() as Notification));
        callback(notifs);
    }, (error) => {
        console.warn("Notification snapshot error:", error.message);
    });
  },
  
  // Kept for backward compat/one-time fetch if needed
  getNotifications: async (uid: string): Promise<Notification[]> => {
    if (uid.startsWith('phone_')) return [];

    const notifRef = collection(db, "users", uid, "notifications");
    const snap = await getDocs(notifRef);
    let notifs: Notification[] = [];
    snap.forEach(doc => notifs.push(doc.data() as Notification));
    return notifs.sort((a, b) => b.createdAt - a.createdAt);
  },

  markNotificationRead: async (uid: string, notifId: string): Promise<void> => {
      if (uid.startsWith('phone_')) return;
      await updateDoc(doc(db, "users", uid, "notifications", notifId), { read: true });
  },

  markAllNotificationsRead: async (uid: string): Promise<void> => {
      if (uid.startsWith('phone_')) return;
      
      const notifRef = collection(db, "users", uid, "notifications");
      const q = query(notifRef, where("read", "==", false));
      const snap = await getDocs(q);
      
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
          batch.update(d.ref, { read: true });
      });
      await batch.commit();
  },

  // --- Invite & User Logic (Firestore) ---

  getAllUsers: async (): Promise<UserProfile[]> => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    
    const invitesSnapshot = await getDocs(collection(db, "invites"));
    invitesSnapshot.forEach((d) => {
       const inv = d.data() as Invite;
       if (!inv.used) {
           users.push({
             uid: 'pending_' + d.id,
             email: inv.email,
             displayName: 'Invited User',
             role: inv.role,
             status: 'invited',
             userId: 'PENDING',
             createdAt: inv.createdAt,
             invitedBy: inv.invitedBy,
             invitedAt: inv.createdAt
           });
       }
    });

    return users;
  },

  inviteUser: async (email: string, role: UserRole, invitedByUid: string): Promise<string> => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      throw new Error("User already exists with this email.");
    }

    const iq = query(collection(db, "invites"), where("email", "==", email), where("used", "==", false));
    const iSnapshot = await getDocs(iq);
    if (!iSnapshot.empty) {
      throw new Error("Invite already pending for this email.");
    }

    // Using random string as document ID/token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const invite: Invite = {
      token,
      email,
      role,
      invitedBy: invitedByUid,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 Days expiry
      createdAt: Date.now(),
      used: false
    };

    // Creating this doc triggers the Cloud Function to send email
    await setDoc(doc(db, "invites", token), invite);
    return token;
  },

  // NEW: Resend Invite Logic
  // This effectively deletes the old invite and creates a new one to trigger the Cloud Function again
  resendInvite: async (oldToken: string): Promise<void> => {
      // 1. Get old invite data
      const inviteRef = doc(db, "invites", oldToken);
      const inviteSnap = await getDoc(inviteRef);
      
      if (!inviteSnap.exists()) {
          throw new Error("Invite not found or already deleted.");
      }
      
      const oldInvite = inviteSnap.data() as Invite;
      
      // 2. Delete old invite (Cancel)
      await deleteDoc(inviteRef);
      
      // 3. Create new invite (Trigger 'onCreate' cloud function)
      // We pass the same email, role and the original inviter ID
      await mockDbService.inviteUser(oldInvite.email, oldInvite.role, oldInvite.invitedBy);
  },

  validateInviteToken: async (token: string): Promise<Invite> => {
      const inviteRef = doc(db, "invites", token);
      const inviteSnap = await getDoc(inviteRef);
      
      if (!inviteSnap.exists()) throw new Error("Invalid invite link.");
      
      const invite = inviteSnap.data() as Invite;
      if (invite.used) throw new Error("This invite has already been used.");
      if (invite.expiresAt < Date.now()) throw new Error("Invite link expired.");

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
            role: invite.role, // Assign role from invite
            status: 'accepted', // User accepts invite -> Status: accepted
            userId: generateUserId(),
            createdAt: Date.now(),
            invitedBy: invite.invitedBy,
            invitedAt: invite.createdAt
        };

        // Create User Doc
        await setDoc(doc(db, "users", userCredential.user.uid), newUserProfile);
        
        // Mark Invite as Used and Accepted
        await updateDoc(doc(db, "invites", token), { used: true, status: 'accepted' });

        await signOut(auth);
     } catch (e: any) {
         if (e.code === 'auth/email-already-in-use') {
             throw new Error("Account already exists. Please login.");
         }
         throw e;
     }
  },

  updateUserRole: async (targetUid: string, newRole: UserRole): Promise<void> => {
    const userRef = doc(db, "users", targetUid);
    await updateDoc(userRef, { role: newRole });
  },

  toggleUserBlock: async (targetUid: string, currentStatus: UserStatus): Promise<void> => {
    const userRef = doc(db, "users", targetUid);
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    await updateDoc(userRef, { status: newStatus });
  },

  deactivateUser: async (targetUid: string): Promise<void> => {
     try {
        if (targetUid.startsWith('pending_')) {
           // CANCEL INVITE LOGIC: Permanently delete from DB
           const token = targetUid.replace('pending_', '');
           await deleteDoc(doc(db, "invites", token));
        } else {
           const userRef = doc(db, "users", targetUid);
           await updateDoc(userRef, { status: 'blocked' });
        }
     } catch (error: any) {
        console.error("Deactivate failed in service:", error);
        throw error;
     }
  },
  
  deleteSystemUser: async (uid: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "users", uid));
    } catch (error) {
        console.error("Failed to delete user data:", error);
        throw new Error("System deletion failed");
    }
  },

  // NEW: Toggle Expert Status (Moved from Auth Service)
  toggleExpertStatus: async (uid: string, isExpert: boolean): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), { isExpert });
  }
};
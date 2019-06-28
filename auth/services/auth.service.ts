import { Injectable } from "@angular/core";

import { Router } from "@angular/router";

import { auth } from 'firebase';
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/firestore";

import { User, UserProfile, Roles } from "ngfire-shared";

/**
 * Authentication Service
 * 
 * @see https://angularfirebase.com/lessons/google-user-auth-with-firestore-custom-data/
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private afAuth: AngularFireAuth,
              private afs: AngularFirestore,
              private router: Router)
  { }


  public loadGoogleLogin(profile?: UserProfile, roles?: Roles)
  {
    const provider = new auth.GoogleAuthProvider();
    return this._oAuthLogin(provider, profile, roles);
  }

  public loadFacebookLogin(profile?: UserProfile, roles?: Roles)
  {
    const provider = new auth.FacebookAuthProvider();
    return this._oAuthLogin(provider, profile, roles);
  }

  public loadMicrosoftLogin(profile?: UserProfile, roles?: Roles)
  {
    let provider = new auth.OAuthProvider('microsoft.com');
    return this._oAuthLogin(provider, profile, roles); 
  }

  private _oAuthLogin(provider: auth.AuthProvider, profile?: UserProfile, roles?: Roles)
  {
    return this.afAuth.auth
                .signInWithPopup(provider)
                .then((credential) => this.updateUserData(credential.user, profile, roles));
  }

  private updateUserData(user: firebase.User | null, profile?: UserProfile, roles?: Roles)
  {
    if (!user)
      throw "Unable to save new user. User Registration failed.";
    
    // Get user collection
    const userRef: AngularFirestoreDocument<User> = this.afs.doc(`users/${user.uid}`);

    const data: any = {}; // Actual Type: User
    
    data.profile = profile ? profile : {};
    data.roles = roles ? roles : { access: false };
    
    if (user.email) data.email = user.email;
    if (user.photoURL) data.photoUrl = user.photoURL;
    if (user.displayName) data.displayName = user.displayName;
    
    // Add new user to collection, update data if already exists.
    return userRef.set(data, { merge: true });
  }
   
  signOut() {
    this.afAuth.auth.signOut().then(() => {
      this.router.navigate(['/']);
    });
  }
}

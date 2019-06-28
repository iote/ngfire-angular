import { Injectable } from "@angular/core";

import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore } from "@angular/fire/firestore";

import { map } from "rxjs/operators";

import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { User } from "ngfire-shared";

/**
 * Wrapper around Firebase User Services. RxJS subscriptions.
 * 
 * @see https://angularfirebase.com/lessons/google-user-auth-with-firestore-custom-data/
 */
@Injectable({ providedIn: 'root' })
export class UserService {

  private _user$: Observable<User>;

  constructor(private _afAuth: AngularFireAuth,
    private _afs: AngularFirestore) {
    // Set user variable. Observe the firebase user.
    this._user$ = this._initUserSubject();
  }

  /** Get auth data, then get firestore user document || false */
  public getUser(): Observable<User> {
    return this._user$;
  }

  public getUserId(): Observable<string> {
    return this.getUser()
      .pipe(map(u => u.uid));
  }

  public updateUser(user: User) {
    return this._afs.doc<User>(`users/${user.uid}`).update(user);
  }

  public getUsers() {
    return this._afs.collection<User[]>('users').valueChanges();
  }

  private _initUserSubject()
  {
    return this._afAuth
                .authState
                .pipe(switchMap(user => { // Subscription, if doc changes everything changes.
                  
                  return <Observable<User>> (user ?  this._afs.doc<User>(`users/${user.uid}`).valueChanges()
                                                  : of(null));
                }));
  }
}

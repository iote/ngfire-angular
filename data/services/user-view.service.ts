import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import { UserService } from '../../auth/services/user.service';

import { UserViewRepository } from '../repositories/userview-repository.model';
import { IUserObject } from 'ngfire-shared';

/**
 * Service that creates UserView Repositories
 * 
 * Goal: Have single point of UserView database table configuration.
 */
@Injectable({ providedIn: 'root' })
export class UserViewService {

  constructor(private _db: AngularFirestore,
              private _userService: UserService)
  {}

  public createRepo<T extends IUserObject>(collectionName: string) {
    return new UserViewRepository<T>(collectionName, this._db, this._userService);
  }
}

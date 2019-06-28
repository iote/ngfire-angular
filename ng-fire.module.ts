import { NgModule } from '@angular/core';

import { UserService } from './auth/services/user.service';
import { AuthService } from './auth/services/auth.service';
import { DataService } from './data/services/data.service';
import { BackendService } from './backend/backend.service';

/**
 * NgFire Module
 * 
 * Contains: Interactions with backend, Authentication.
 */
@NgModule({
  imports: [],
  providers: [UserService, AuthService, DataService, BackendService],
  exports: []
})
export class NgFireModule { }

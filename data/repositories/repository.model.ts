import { Observable, from } from 'rxjs';
import { flatMap, map, catchError } from 'rxjs/operators';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import { Query } from 'ngfire-firestore-query-builder';
import { IObject } from 'ngfire-shared';

import { UserService } from '../../auth/services/user.service';


export class Repository<T extends IObject> {

  constructor(private _collectionName: string,
              private _db: AngularFirestore | AngularFirestoreDocument, 
              private _userService: UserService)
  { }

  /**
   * Gets documents owned by user (user_id field == uid).
   */
  public getUserDocuments(query = new Query()): Observable<T[]> {

    return this._userService.getUserId()
                            .pipe(flatMap(uid => 
                              {
                                query.where('createdBy', '==', uid);
                                
                                return this.getDocuments(query);
                              }));
                                                    
  }

  public getDocumentById(id: string): Observable<T> {
    return this._db.collection(this._collectionName)
                   .doc(id).snapshotChanges()
                   .pipe(map(d => { 
                      const obj = <T> d.payload.data(); 
                      obj.id = id; 
                      return obj; 
                    }));
  }

  public getDocuments(query: Query = new Query()): Observable<T[]> {

    return <Observable<T[]>>
      this._db.collection(this._collectionName,
                          // Execute query builder
                          s => query.__buildForFireStore(s))
              .snapshotChanges()
              .pipe(map(this._mergeWithDocId));
  }

  public getLatestDocument(query: Query = new Query()): Observable<T[]> {
    return <Observable<T[]>>
      this._db.collection(this._collectionName,
                          // Execute query builder
                          s => query.__buildForFireStore(s).orderBy('createdOn', 'desc').limit(1))
              .snapshotChanges()
              .pipe(map(this._mergeWithDocId));
  }

  /**
   * Creates a document and returns an active document (with DB id attached)
   * 
   * @param t 
   */
  public create(t: any): Observable<T>
  {
    t.createdOn = new Date();
    
    const query = this._userService
                      .getUserId()
                      .pipe(flatMap(uid => {
                                      t.createdBy = uid;
                                      // Turn promise into observable
                                      return from(this._db.collection(this._collectionName).add(t));
                                    }),
    );
  
    return query.pipe(map((r, i) => { t.id = r.id; return t; }),
                      // Note: https://stackoverflow.com/questions/42704552/rxjs-observable-of-vs-from
                      catchError(e => { throw new Error(e.message); })); 
  }

  public update(t: T): Observable<T>
  {
    if (!t.id)
      throw new Error("Trying to update POJO-object. Need active document with database id.");
    
    t.updatedOn = new Date();

    return from(this._db.collection(this._collectionName)
                        .doc(t.id)
                        .update(t))
                        .pipe(map(() => t),
                              catchError(e => { throw new Error(e.message ); }));
  }

  public delete(t: T): Observable<T>
  {
    if (!t.id)
      throw new Error("Trying to update POJO-object. Need active document with database id.");

    return from(this._db.collection(this._collectionName)
                        .doc(t.id)
                        .delete())
                        .pipe(map(() => t),
                              catchError(e => { throw new Error(e.message ); }));
  }

  /** By default, Firebase does not store document id. We therefore merge documents with their id. */
  private _mergeWithDocId(actions: any[]) : T[]
  {
    return actions.map(a => {
      const data = <T> a.payload.doc.data();
            data.id = a.payload.doc.id;
      
      return data;
    });

  }


  /**
   * Child repository. Repository that links to a sub-collection of specific document.
   * 
   * @param collectionName Child collection name to listen to.
   */
  getChildRepository<Y extends IObject>(docId: string, childCollectionName: string): Repository<Y>
  {
    const document = <AngularFirestoreDocument<T>> this._db.collection(this._collectionName).doc(docId);

    return new Repository<Y>(childCollectionName, document, this._userService);
  }
}

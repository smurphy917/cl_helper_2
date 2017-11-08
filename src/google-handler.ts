import {GoogleAccount, GoogleAuthCredential} from './types'
//import * as store from 'store'
import * as google from 'googleapis'
import {mapHandlerPlugin} from './storagePlugins';
import {database} from './main'

//store.addPlugin(mapHandlerPlugin);

export const GOOGLE_AUTH = require('../google-auth')
export const REQUIRED_SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
]
export const AUTH_PORT = 8899;
const AUTH_REDIRECT = `http://localhost:${AUTH_PORT}/oauthcallback`;

export class NoCredentialFoundError extends Error{
    authUrl:string
    constructor(message?:string){   
        super()
        this.name = 'NO_CREDENTIAL_FOUND_ERR';
        if(message){
            this.message = message;
        }
    }
}

export class GoogleHandler{

    account:GoogleAccount
    //authFactory = new GoogleAuth()
    cred:GoogleAuthCredential
    credStore:Map<GoogleAccount,GoogleAuthCredential>
    oauthClient:google.auth.OAuth2
    gmail:google.gmail

    constructor(callback?:()=>void){
        this.loadStore(callback);
    }

    loadStore(callback?:()=>void){
        //TODO - load credStore from local data
        this.credStore = new Map<GoogleAccount, GoogleAuthCredential>();
        database.find({store:'google_cred_store'},(err,docs) => {
            if(err){
                //TODO: check error type, throw if necessary
            }
            for (let doc of docs){
                this.credStore.set(doc.key,doc.value);
            }
            callback();
        });
        // this.credStore = store.get('google_cred_store') as Map<GoogleAccount,GoogleAuthCredential>;
        // if(this.credStore === undefined)
        //     this.credStore = new Map<GoogleAccount,GoogleAuthCredential>();
    }

    saveStore(callback?:()=>void){
        // store.set('google_cred_store',this.credStore);
        let count = 0, length = this.credStore.size;
        this.credStore.forEach((val,key) => {
            database.update({key:key},{value:val},{},(err,numReplaced) => {
                if(err)
                    throw err;
                    //TODO: check err
                if(numReplaced==0){
                    database.insert({
                        key:key,
                        value:val,
                        store:'google_cred_store'
                    },(err,newDoc)=>{
                        if(err)
                            throw err;
                        console.log(newDoc);
                        count++;
                        if(count==length){
                            callback();
                        }
                    });
                }else{
                    count++;
                    if(count==length){
                        callback();
                    }
                }
            });
        });
    }

    // getApplicationDefault(){
    //     this.authFactory.getApplicationDefault(function(err, authClient) {
    //         if (err) {
    //             console.log('Authentication failed because of ', err);
    //             return;
    //         }
    //         if (authClient.createScopedRequired && authClient.createScopedRequired()) {
    //             var scopes = REQUIRED_SCOPES;
    //             authClient = authClient.createScoped(scopes);
    //         }
    //         
    //         var request = {
    //             // TODO: Change placeholders below to values for parameters to the 'get' method:
    //         
    //             // Identifies the project addressed by this request.
    //             project: "",
    //             // Identifies the managed zone addressed by this request. Can be the managed zone name or id.
    //             managedZone: "",
    //             // The identifier of the requested change, from a previous ResourceRecordSetsChangeResponse.
    //             changeId: "",
    //             // Auth client
    //             auth: authClient
    //         };
    //     });
    // }

    retrieveCreds(account:GoogleAccount):GoogleAuthCredential{
        try{
            var cred = this.credStore.get(account);
            if(!cred){
                throw new Error('catch below');
            }
            return cred;
        }catch(e){
            //throw new NoCredentialFoundError(`No credentials found for account: ${account.name}`);
            this.oauthClient = new google.auth.OAuth2(
                GOOGLE_AUTH.installed.client_id,
                GOOGLE_AUTH.installed.client_secret,
                AUTH_REDIRECT
            );
            let msg = 'New Account';
            if(account){
                msg = `No credentials found for account: ${account.email}`;
            }
            let err = new NoCredentialFoundError(msg);
            err.authUrl = this.oauthClient.generateAuthUrl({
                scope:REQUIRED_SCOPES
            });
            throw err;
        }
    }

    storeCreds(input:{account?:GoogleAccount,credential?:GoogleAuthCredential,auth_code?:string},callback?:()=>void){
        if (!input.credential){
            if(input.auth_code){
                //call account service to get credential. 
                this.oauthClient.getToken(input.auth_code,(err,tokens) => {
                    if(!err){
                        this.oauthClient.setCredentials(tokens);
                        this.getUserInfo(userInfo => {
                            this.storeCreds({
                                account:{
                                    email:userInfo.emailAddress
                                },
                                credential:this.oauthClient.credentials
                            },callback);
                        });
                        return;
                    }
                    throw err;
                })
            }
        }else{
            if(input.account){
                this.credStore.set(input.account,input.credential);
            }else{
                this.credStore.set(
                    {
                        email:input.credential.email,
                    },
                    input.credential
                )
            }
            this.saveStore(callback);
        }
    }

    getUserInfo(callback){
        if(!this.gmail){
            this.gmail = google.gmail({
                version:'v1',
                auth:this.oauthClient
            });
        }
        this.gmail.users.getProfile({userId:'me'},(err,profile) => {
            if(!err){
                callback(profile);
                return;
            }
            throw err;
        });
    }

    getAccounts(){
        return this.credStore.keys();
    }
}
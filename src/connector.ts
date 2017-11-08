import {Observable, Subject, BehaviorSubject} from 'rxjs'
//import {remote} from 'electron'
const {CLHelper} = require('electron').remote.require('./core')
import {Account,GoogleAccount,Post} from './types';

export const APPLICATION_TYPES:{ELECTRON:0,WEB:1} = {
    ELECTRON: 0,
    WEB: 1
}

const APPLICATION_TYPE:0|1 = APPLICATION_TYPES.ELECTRON;



export class Connector {

    accounts: BehaviorSubject<Account[]>
    _accounts: Account[]
    google_accounts: BehaviorSubject<GoogleAccount[]>
    _google_accounts: Array<GoogleAccount>
    posts: Subject<Post>
    helper: any

    constructor(type:number){

        this._accounts = [];
        this._google_accounts = [];
        
        if(type==APPLICATION_TYPES.ELECTRON){
            this.helper = new CLHelper()
            this.posts = this.helper.posts;
            this.accounts = this.helper.accounts;
            this.google_accounts = this.helper.google_accounts;
        }else{
            this.posts = new Subject();
            this.accounts = new BehaviorSubject(this._accounts);
            this.google_accounts = new BehaviorSubject(this._google_accounts);
        }
    }
    addAccount(account:Account){
        //do the actual adding of the account
        //ELECTRON
        this.helper.addAccount(account);
        if(0){
            this._accounts.concat(account);
            this.accounts.next(this._accounts);
        }
    }
    addGoogleAccount(googleAccount?:GoogleAccount){
        //ELECTRON
        this.helper.addGoogleAccount(googleAccount);
        if(0){
            //WEB
            this._google_accounts.concat(googleAccount);
            this.google_accounts.next(this._google_accounts);
        }
    }

    start(input:{accounts:Account[],period:number}){
        //ELECTRON
        this.helper.start(input);
    }



}
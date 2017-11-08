//const jQuery = require('../node_modules/jquery/dist/jquery.js');
import {app, BrowserWindow} from 'electron'
import {Observable, Subject, BehaviorSubject} from 'rxjs'
import {Account, GoogleAccount, Post} from './types'
import {GoogleHandler, NoCredentialFoundError, AUTH_PORT} from './google-handler'
import {database, MainWindow} from './main'
import {URLSearchParams, URL, format as URLFormat} from 'url'
import {Object} from 'core-js'
import * as express from 'express'
import * as path from 'path'
import {EventEmitter} from 'events'
import {InteractiveBrowserWindow,InteractiveBrowserNodeResult} from './interactiveBrowser'
import * as dateFormat from 'dateformat'

const DEBUG_MODE = true;
const CL_BASE = "http://accounts.craigslist.org";

export class CLHelper{
    posts = new Subject<Post>()
    accounts: Subject<Account[]>
    _accounts = new Array<Account>()
    google_accounts: Subject<GoogleAccount[]>
    _google_accounts = new Array<GoogleAccount>()
    google:GoogleHandler;
    authWin:BrowserWindow;
    period_ms = 6000;
    runTimer: NodeJS.Timer;
    runAccounts:Account[];
    currentAccount:Account;

    constructor(){
        this.accounts = new BehaviorSubject(this._accounts);
        this.google_accounts = new BehaviorSubject(this._google_accounts);
        this.google = new GoogleHandler(() => {
            this.google_accounts.next(
                Array.from(this.google.getAccounts())
            );
        });
        this.loadAccounts();
        //process.env.GOOGLE_APPLICATION_CREDENTIAL = path.join(__dirname,'..','google-creds.json');
    }

    addGoogleAccount(googleAccount?:GoogleAccount){
        
        try{
            this.google.retrieveCreds(googleAccount ? googleAccount : null)
        }catch(e){
            if(e instanceof NoCredentialFoundError){
                this.authWin = new BrowserWindow({parent: MainWindow, modal:true, width: 800, height: 600});
                this.authWin.webContents.openDevTools();
                let url = e.authUrl;
                this.startAuthServer((code) => {
                    console.log(code);
                    this.google.storeCreds({auth_code:code},() => {
                        this.google_accounts.next(
                            Array.from(this.google.getAccounts())
                        );
                    });
                });
                this.authWin.loadURL(URLFormat(url));
            }
        }

    }

    startAuthServer(callback){
        let server = new express();

        server.get('/oauthcallback',(req,res)=>{
            console.log(req);
            callback(req.query.code);
            this.authWin.close();
        });

        server.listen(AUTH_PORT);
    }

    addAccount(account:Account){
        database.insert({
            key: account.email,
            value: account,
            store: 'user_store'
        },(err,newDoc)=>{
            this._accounts.push(account);
            this.accounts.next(this._accounts);
        });
    }

    loadAccounts(){
        database.find({store:'user_store'},(err,docs)=>{
            if(err)
                throw err;
            docs.map(doc => this._accounts.push(doc.value));
            this.accounts.next(this._accounts);
        });
    }

    start(input:{accounts:Account[],period:number}){
        this.runAccounts = input.accounts;
        this.currentAccount = this.runAccounts[0];
        this.period_ms = input.period * 1000;
        this.run(() => {
            this.runTimer = setInterval(this.run,this.period_ms);
        });
    }

    pause(){
        clearInterval(this.runTimer);
    }

    run(done?:()=>void){

        //DO THE WORK
        //FOR ELECTRON...
            //open invisible window
            //do the stuff
        let runWin = new InteractiveBrowserWindow({show:DEBUG_MODE});
        runWin.webContents.openDevTools();
        //TODO: handle pending posts
        //TODO: handle rolling accounts
        runWin.loadURL(CL_BASE + '/login/home');
        var loginAttempts = 0;
        var loads = 0;
        var monthsBack = 2;
        runWin.webContents.on('did-finish-load',() => {
            //switch based on page
            loads++;
            console.log(`LOADS: ${loads}`);
            switch(runWin.webContents.getTitle()){
                case 'craigslist - account log in':
                    Promise.all([
                        runWin.$("#inputEmailHandle").val(this.currentAccount.email),
                        runWin.$("#inputPassword").val(this.currentAccount.password)
                    ]).then((resArr) => {
                        console.log(resArr);
                        if(loginAttempts > 0){
                            runWin.$("iframe[src*='google.com/recaptcha']").length().then((len) => {
                                if(!len){
                                    runWin.$("button.accountform-btn").click()
                                }
                                //else user does captcha
                            })
                        }else{
                            runWin.$("button.accountform-btn").click()
                        }
                        loginAttempts++;
                    }).catch((reason) => {throw new Error(reason)});
                    break;
                case 'craigslist account':
                    //logged in successfully, now go to posts page
                    var queryDate = new Date();
                    queryDate.setMonth(queryDate.getMonth() - monthsBack);
                    runWin.get('/login/home',{params:{
                        filterDate: dateFormat(queryDate,'yy-m')
                    }});
                    break;
            }
        });
        
        //FOR WEB
            //use phantom-js (?)
    }
}
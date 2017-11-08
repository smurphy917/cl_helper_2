import {BrowserWindow, WebContents} from 'electron'
import {URL,format as URLFormat, URLSearchParams} from 'url'

export class InteractiveBrowserNodeResult {
    expr:string
    contents:WebContents
    constructor(contents:WebContents,expr:string){
        this.contents = contents;
        this.expr = expr;
    }

    val(setValue?:string|number|boolean):Promise<string|number|boolean|InteractiveBrowserNodeResult>{
        var self = this;
        if(setValue){
            if(typeof setValue == "string"){
                setValue = `"${setValue}"`;
            }
            var js = `_$("${self.expr}").val(${setValue})`;
            return new Promise((resolve,reject) => {
                self.contents.executeJavaScript(js,false,() => {
                    resolve(self);
                });
            });
        }else{
            var js = `_$("${self.expr}").val()`;
            return new Promise((resolve,reject) => {
                self.contents.executeJavaScript(js,false,(result:string|number|boolean) => {
                    resolve(result);
                });
            });
        }
    }

    click():Promise<InteractiveBrowserNodeResult>{
        var js = `_$("${this.expr}").click()`;
        return new Promise((resolve,reject) => {
            this.contents.executeJavaScript(js,false,() => {
                resolve(this);
            });
        });
    }

    length():Promise<number>{
        var js = `_$("${this.expr}").length`;
        return new Promise((resolve,reject) => {
            this.contents.executeJavaScript(js,false,(result:number) => {
                resolve(result);
            });
        });
    }
}

export class InteractiveBrowserWindow extends BrowserWindow {
    contents:WebContents
    constructor(options:{}){
        super(options);
        this.contents = this.webContents;
        this.setjQueryListener();
    }

    setjQueryListener(){
        this.contents.on('dom-ready',(ev) => {
            this.contents.executeJavaScript(
                `var jq = document.createElement('script');
                jq.setAttribute('src','https://code.jquery.com/jquery-3.2.1.min.js');
                var jqNoConflict = document.createElement('script');
                jqNoConflict.textContent = 'window._$ = $.noConflict(true);';
                document.head.prepend(jq);
                jq.insertAdjacentElement('afterend',jqNoConflict);`
            );
        })
    }

    $(expr:string):InteractiveBrowserNodeResult{
        return new InteractiveBrowserNodeResult(this.contents,expr);
    }

    get(path:string,options?:{params?:{[key:string]:string | string[]}}){
        var baseUrl = '';
        if(path.startsWith('http://') || path.startsWith('https://') || path.startsWith('file://')){
            baseUrl = path;
        }else if(path.startsWith('/')){
            baseUrl = this.contents.getURL();
            baseUrl = /https?:\/\/[a-zA-Z0-9\.-]*/.exec(baseUrl)[0] + path;
        }else{
            throw Error('path should start with either "/" for relative paths, or http[s]:// | file:// for absolute paths.');
        }
        var targetUrl = new URL(baseUrl);
        if(options && options.params){
            targetUrl.search = new URLSearchParams(options.params).toString();
        }
        this.contents.loadURL(URLFormat(targetUrl));
    }
}
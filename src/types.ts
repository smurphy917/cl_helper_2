export interface Account {
    email:string,
    password:string,
    google_email:string,
    id:string
}
export interface GoogleAccount {
    email:string
}

export interface AccountChange {
    added?:Account,
    removed?:Account,
    accounts:Account[]
}

export interface Post{
    id:string,
    message:string
}

export interface GoogleAuthCredential{
    email:string
    private_key:string,
    project_id:string
}

declare global {
    namespace  NodeJS {
        interface Global {
            localStorage: any
        }
    }
}
export function mapHandlerPlugin(){
    function get(super_fn,key){
        let sVal = super_fn(key);
        if(sVal && sVal.type && sVal.type=='Map'){
            let deserializedVal = new Map();
            for(let entry of sVal.entries){
                deserializedVal.set(entry.key,entry.value);
            }
            return deserializedVal;
        }else{
            return sVal;
        }
    }
    function set(super_fn,key,val){
        if(val instanceof Map){
            let serializedValue = {
                type:'Map',
                entries:[]
            };
            val.forEach((mVal,mKey) => {
                serializedValue.entries.push(
                    {
                        key: mKey,
                        value: mVal
                    }
                )
            });
            return super_fn(key,serializedValue);
        }else{
            return super_fn(key,val);
        }
    }
    return {
        get: get,
        set: set
    }
}
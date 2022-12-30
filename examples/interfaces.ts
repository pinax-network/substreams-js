export interface DatabaseOperation {
    // trace information
    blockNum: number;
    timestamp: any;
    trxId: string;
    actionIndex: number;
  
    // database operation
    code: string;              // contract name (ex: "eosio.token")
    tableName: string;         // table name (ex: "accounts")
    scope: string;             // scope name (ex: "EOS")
    primaryKey: string;        // primary key (ex: "myaccount")
  
    // table data
    oldData: Uint8Array;      // old data (bytes)
    newData: Uint8Array;      // new data (bytes)
}
export interface ActionTrace {
    // trace information
    block_num: number;
    timestamp: TimeStamp;
    trxId: string;
    actionOrdinal: number;

    // action
    account: string;
    receiver: string;
    name: string;

    // action data
    json_data: string;
}

export interface TransferEvent {
    // trace information
    block_num: number;
    timestamp: TimeStamp;
    trxId: string;
    actionOrdinal: number;

    // action data
    contract: string;
    symcode: string;
    precision: number;
    from: string;
    to: string;
    amount: number;
    memo: string;
}

export interface TimeStamp {
    seconds: number;
    nanos: 500000000;
}

export interface DatabaseOperation {
    // trace information
    blockNum: number;
    timestamp: TimeStamp;
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

export interface Account {
    account: Uint8Array;
}

export interface CurrencyStats {
    currencyStats: Uint8Array;
}
import { ABI, Serializer } from "@greymass/eosio"

const abi = ABI.from({
    structs: [
        {
            name: "account",
            base: "",
            fields: [
                {name: "balance",type: "asset"}
            ]
        },
        {
            name: "currency_stats",
            base: "",
            fields: [
                {name: "supply",type: "asset"},
                {name: "max_supply",type: "asset"},
                {name: "issuer",type: "name"}
            ]
        },
    ],
})

export function decodeBalance(dbOp: any) {
    const { tableName, code, primaryKey } = dbOp;
    if ( dbOp.tableName !== "accounts") return null;
    const data = dbOp.newData.toString("hex");
    try {
        const decoded: any = Serializer.decode({data, type: 'account', abi});
        return decoded.balance.toString();
    } catch (e: any) {
        console.error({error: e.message, tableName, code, primaryKey});
        return null;
    }
}

export function decodeStat(dbOp: any) {
    const { tableName, code, primaryKey } = dbOp;
    if ( dbOp.tableName !== "stat") return null;
    const data = dbOp.newData.toString("hex");
    try {
        const decoded: any = Serializer.decode({data, type: 'currency_stats', abi});
        return decoded.supply.toString();
    } catch (e: any) {
        console.error({error: e.message, tableName, code, primaryKey});
        return null;
    }
}

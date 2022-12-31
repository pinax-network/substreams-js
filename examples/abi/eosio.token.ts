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

export function decodeAccount(data: Uint8Array) {
    const hex = Buffer.from(data).toString("hex");
    try {
        const decoded: any = Serializer.decode({data: hex, type: 'account', abi});
        return {
            balance: decoded.balance.toString()
        }
    } catch (e: any) {
        console.error({error: e.message});
        return null;
    }
}

export function decodeCurrencyStats(data: Uint8Array) {
    const hex = Buffer.from(data).toString("hex");
    try {
        const decoded: any = Serializer.decode({data: hex, type: 'currency_stats', abi});
        return {
            supply: decoded.supply.toString(),
            max_supply: decoded.max_supply.toString(),
            issuer: decoded.issuer.toString(),
        }
    } catch (e: any) {
        console.error({error: e.message});
        return null;
    }
}

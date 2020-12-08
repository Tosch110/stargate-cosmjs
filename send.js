import { fromBase64, toHex } from "@cosmjs/encoding";
import { StargateClient } from "@cosmjs/stargate";
import { cosmos, google } from "./generated";
import { DirectSecp256k1HdWallet, Registry, makeAuthInfoBytes, makeSignBytes, makeSignDoc } from "@cosmjs/proto-signing";

const mnemonic = "kiwi moral powder twist country decline gallery dawn horse mass access amused right situate gesture better caution empower viable rack captain model depend dune";

(async () => {

    const { TxRaw } = cosmos.tx.v1beta1;
    const { PubKey } = cosmos.crypto.secp256k1;
    const { Any } = google.protobuf;
    
    const chainId = "sgblock";
    
    const client = await StargateClient.connect("localhost:26657");
    
    const myRegistry = new Registry();
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [{ address, pubkey: pubkeyBytes }] = await wallet.getAccounts();
    const publicKey = PubKey.create({
        key: pubkeyBytes,
    });
    const publicKeyBytes = PubKey.encode(publicKey).finish();
    
    const { accountNumber, sequence } = (await client.getSequence(address));
    const txBodyFields = {
        messages: [
        {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
            fromAddress: address,
            toAddress: makeRandomAddress(),
            amount: [
                {
                denom: "token",
                amount: "10",
                },
            ],
            },
        },
        ],
    };
    const txBodyBytes = myRegistry.encode({
        typeUrl: "/cosmos.tx.v1beta1.TxBody",
        value: txBodyFields,
    });
    
    const publicKeyAny = Any.create({ type_url: "/cosmos.crypto.secp256k1.PubKey", value: publicKeyBytes });
    // const accountNumber = 1;
    
    const feeAmount = [
        {
            amount: "1",
            denom: "token",
        },
        ];
    
    const gasLimit = 200000;
    const authInfoBytes = makeAuthInfoBytes([publicKeyAny], feeAmount, gasLimit, sequence);
    const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, chainId, accountNumber);
    const signDocBytes = makeSignBytes(signDoc);
    console.log(toHex(signDocBytes))
    
    const { signature } = await wallet.signDirect(address, signDoc);
    const txRaw = TxRaw.create({
        bodyBytes: txBodyBytes,
        authInfoBytes: authInfoBytes,
        signatures: [fromBase64(signature.signature)],
    });
    const txRawBytes = Uint8Array.from(TxRaw.encode(txRaw).finish());
    const txResult = await client.broadcastTx(txRawBytes);
    const txBytesHex = toHex(txRawBytes);
    console.log(txBytesHex);
    
    console.log(txResult);

})();


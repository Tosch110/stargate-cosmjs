import protobufjs from "protobufjs";

import { fromBase64, toHex, Bech32 } from "@cosmjs/encoding";
import { StargateClient } from "@cosmjs/stargate";
import { cosmos, google } from "./generated";
import { DirectSecp256k1HdWallet, makeAuthInfoBytes, makeSignBytes, makeSignDoc } from "@cosmjs/proto-signing";


(async () => {
    const { Tx, TxRaw, TxBody } = cosmos.tx.v1beta1;
    const { PubKey } = cosmos.crypto.secp256k1;
    const { Any } = google.protobuf;
    
    const chainId = "sgblock";
    
    const blogProto = await protobufjs.load("proto/blog.proto");
    const client = await StargateClient.connect("http://localhost:26657");
    
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic("enact violin torch lucky creek shoulder win helmet edge gold joy disagree knife habit mouse whale almost virtual verb pen dial found random force");
    const [{ address, pubkey: pubkeyBytes }] = await wallet.getAccounts();
    const publicKey = PubKey.create({
    key: pubkeyBytes,
    });
    const publicKeyBytes = PubKey.encode(publicKey).finish();
    
    const { accountNumber, sequence } = (await client.getSequence(address));
    
    console.log(address)
    console.log(accountNumber, sequence);
    console.log(publicKey);
    console.log(Bech32.decode(address).data);

    const typeUrl = "/sgblock.sgblock.v1beta1.MsgBlog";
    // myRegistry.register(typeUrl, blogProto);
    const encoder = blogProto.lookupType(getTypeName(typeUrl));
    const msgDemo = (encoder.create({
        id: "5",
        creator: address,
        title: "my title",
        body: "my content text"
    }));
    const msgDemoBytes = encoder.encode(msgDemo).finish();
    const msgDemoWrapped = Any.create({
        type_url: typeUrl,
        value: msgDemoBytes,
    });
    
    const txBody = TxBody.create({
        messages: [msgDemoWrapped],
        memo: "Some memo",
        // timeoutHeight: 9999,
        extensionOptions: [],
    });
    const txBodyBytes = TxBody.encode(txBody).finish();
    
    // Deserialization
    // const txBodyDecoded = TxBody.decode(txBodyBytes);
    // const msg = txBodyDecoded.messages[0];
    
    const feeAmount = [
        {
        amount: "8",
        denom: "token",
        },
    ];
    
    const gasLimit = 200000;
    const authInfoBytes = makeAuthInfoBytes([publicKeyBytes], feeAmount, gasLimit, sequence);
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
    console.log("txRawBytes", txRawBytes);
    let txResult;
    try {
        txResult = await client.broadcastTx(txRawBytes);
    } catch(e) {
        console.log("error broadcast: ",e.data)
    }
    const txBytesHex = toHex(txRawBytes);
    console.log("txBytesHex, ", txBytesHex);
    
    console.log("txResult", txResult);
    
    console.log("done");
    // console.log(msg);
})();

function getTypeName(typeUrl) {
    const parts = typeUrl.split(".");
    return parts[parts.length - 1];
}
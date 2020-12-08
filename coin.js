import Long from "long";

import { cosmos, google } from "./generated/index";

const { MsgCreatePost } = require("./build/gen/blog_pb");
const { TxBody } = cosmos.tx.v1beta1;
const { MsgSend } = cosmos.bank.v1beta1;
const { Any } = google.protobuf;


(async () => {

    const msgSend = MsgCreatePost.create({
        title: "Hello",
        body: "Content."
    });


    const msgSendBytes = MsgSend.encode(msgSend).finish();

      const msgSendWrapped = Any.create({
        type_url: "/cosmos.bank.MsgSend",
        value: msgSendBytes,
      });
      const txBody = TxBody.create({
        messages: [msgSendWrapped],
        memo: "Some memo",
        timeoutHeight: Long.fromNumber(9999),
        extensionOptions: [],
      });
      const txBodyBytes = TxBody.encode(txBody).finish();
    
      // Deserialization
      const txBodyDecoded = TxBody.decode(txBodyBytes);
      const msg = txBodyDecoded.messages[0];
      console.log(msg.value);
      const msgSendDecoded = MsgSend.decode(msg.value);
      
      console.log(msgSendDecoded);
    
      // fromAddress and toAddress are now Buffers
    //   console.log(Uint8Array.from(msgSendDecoded.fromAddress)).toEqual(msgSend.fromAddress);
    //   console.log(Uint8Array.from(msgSendDecoded.toAddress)).toEqual(msgSend.toAddress);
    //   console.log(msgSendDecoded.amount).toEqual(msgSend.amount);

})();

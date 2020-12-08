const mocha = require('mocha');
const coMocha = require('co-mocha');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

const assert = require('assert');

coMocha(mocha);

process.env.NODE_ENV = 'test';

chai.use(sinonChai);
chai.use(chaiAsPromised);

// Cloning the constants object to remove immutability
global.expect = chai.expect;
global.sinonSandbox = sinon.createSandbox();
global.assert = assert;
global.sinon = sinon;

// TESTS
// import Blog from "./build/gen/blog_pb";
import { MsgBlog } from "./build/gen/blog_pb";
import protobufjs from "protobufjs";

import { fromBase64, fromHex, toHex, Bech32 } from "@cosmjs/encoding";
import { StargateClient } from "@cosmjs/stargate";
import { Random } from "@cosmjs/crypto";
import { cosmos, google } from "./generated";
// import { defaultRegistry } from "./msgs";
import { DirectSecp256k1HdWallet, Registry, TxBodyValue, makeAuthInfoBytes, makeSignBytes, makeSignDoc } from "@cosmjs/proto-signing";
// import MsgBlog from "./proto/blog";

const { Tx, TxRaw, TxBody } = cosmos.tx.v1beta1;
const { PubKey } = cosmos.crypto.secp256k1;
const { Any } = google.protobuf;

const chainId = "sgblock";

import { Field, Root, Type } from "protobufjs";


describe("Sign custom tx", () => {

    // it("should have the blog proto definition", () => {
    //     assert.strictEqual(Blog.hasOwnProperty('MsgCreatePost'),true);
    //     assert.strictEqual(Blog.hasOwnProperty('MsgCreatePostResponse'),true);
    // });


    it("works with a custom msg", async () => {

      const blogProto = await protobufjs.load("proto/blog.proto");

      const typeUrl = "/sgblock.sgblock.v1beta1.MsgBlog";
      // myRegistry.register(typeUrl, blogProto);
      const encoder = blogProto.lookupType(getTypeName(typeUrl));
      const msgDemo = (encoder.create({
        title: "my title",
        body: "my content text"
      }));
      const msgDemoBytes = encoder.encode(msgDemo).finish();
      const msgDemoWrapped = Any.create({
        type_url: typeUrl,
        value: msgDemoBytes,
      });

      console.log(msgDemoWrapped);
      console.log(TxBody);

      const txBody = TxBody.create({
        messages: [msgDemoWrapped],
        memo: "Some memo",
        timeoutHeight: 9999,
        extensionOptions: [],
      });
      const txBodyBytes = TxBody.encode(txBody).finish();
  
      // Deserialization
      const txBodyDecoded = TxBody.decode(txBodyBytes);
      const msg = txBodyDecoded.messages[0];

      console.log(msg);
    });

    it("creates a custom msg and broadcasts tx", async () => {
      const blogProto = await protobufjs.load("proto/blog.proto");
      const client = await StargateClient.connect("localhost:26657");

      const wallet = await DirectSecp256k1HdWallet.fromMnemonic("device elite page escape wrap open room harbor often south sausage pause trade popular prepare solid tragic soccer lizard face company engage badge print");
      const [{ address, pubkey: pubkeyBytes }] = await wallet.getAccounts();
      const publicKey = PubKey.create({
        key: pubkeyBytes,
      });
      const publicKeyBytes = PubKey.encode(publicKey).finish();

      const { accountNumber, sequence } = (await client.getSequence(address));

      console.log(address)
      console.log(accountNumber, sequence);

      const typeUrl = "/sgblock.sgblock.v1beta1.MsgBlog";
      // myRegistry.register(typeUrl, blogProto);
      const encoder = blogProto.lookupType(getTypeName(typeUrl));
      const msgDemo = (encoder.create({
        id: "2",
        creator: publicKey,
        title: "my title",
        body: "my content text"
      }));
      const msgDemoBytes = encoder.encode(msgDemo).finish();
      const msgDemoWrapped = Any.create({
        type_url: typeUrl,
        value: msgDemoBytes,
      });

      console.log(msgDemoWrapped);
      console.log(TxBody);

      const txBody = TxBody.create({
        messages: [msgDemoWrapped],
        memo: "Some memo",
        // timeoutHeight: 9999,
        extensionOptions: [],
      });
      const txBodyBytes = TxBody.encode(txBody).finish();
  
      // Deserialization
      const txBodyDecoded = TxBody.decode(txBodyBytes);
      const msg = txBodyDecoded.messages[0];

      // const publicKeyAny = Any.create({ type_url: "/cosmos.crypto.secp256k1.PubKey", value: publicKeyBytes });
  
      const feeAmount = [
          {
            amount: "10",
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
      const txResult = await client.broadcastTx(txRawBytes);
      const txBytesHex = toHex(txRawBytes);
      console.log(txBytesHex);

      console.log(txResult);

      console.log(msg);

      assert.strictEqual(1,1);
    });

    it.skip("creates a custom msg and sends", async () => {

      const blogProto = await protobufjs.load("proto/blog.proto");
      const client = await StargateClient.connect("localhost:26657");

      const myRegistry = new Registry();
      const typeUrl = "/sgblock.sgblock.v1beta1.MsgBlog";
      myRegistry.register(typeUrl, blogProto);

      const wallet = await DirectSecp256k1HdWallet.fromMnemonic("device elite page escape wrap open room harbor often south sausage pause trade popular prepare solid tragic soccer lizard face company engage badge print");
      const [{ address, pubkey: pubkeyBytes }] = await wallet.getAccounts();
      const publicKey = PubKey.create({
        key: pubkeyBytes,
      });
      const publicKeyBytes = PubKey.encode(publicKey).finish();

      const { accountNumber, sequence } = (await client.getSequence(address));

      const msgBlog = new MsgBlog({ title: "hello title", body: "Hello content" })
      console.log(msgBlog);


      // const msgDemoBytes = MsgDemo.finish();
      // const msgDemoWrapped = Any.create({
      //   type_url: typeUrl,
      //   value: msgDemoBytes,
      // });


      const txBodyFields = {
        messages: [
          {
            typeUrl,
            value: msgBlog,
          }
          
        ],
      };
      const txBodyBytes = myRegistry.encode({
        typeUrl: "/cosmos.tx.v1beta1.TxBody",
        value: txBodyFields,
      });
  
      const publicKeyAny = Any.create({ type_url: "/cosmos.crypto.secp256k1.PubKey", value: publicKeyBytes });
  
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

      assert.strictEqual(1,1);
    });

    it.skip("sends Token", async () => {

        

      });

    // it("works with generated static code", () => {

    //     const MsgCreatePostType = new Type("MsgCreatePost").add(new Field("creator", 1, "string")).add(new Field("id", 2, "string")).add(new Field("title", 3, "string")).add(new Field("body", 4, "string"));
    //     const root = new Root().define("cosmos.blog.v1beta1").add(MsgCreatePostType);

    //     const registry = new Registry();
    //     const MsgCreatePost = registry.lookupType("/cosmos.blog.v1beta1", root);

    //     console.log(MsgCreatePost);

    //     const msgCreatePost = MsgCreatePost.create({
    //       title: "my title",
    //       body: "my content",
    //     });

    //     console.log(msgCreatePost);
    //     // const msgSendBytes = MsgSend.encode(msgSend).finish();
    //     // const msgSendWrapped = Any.create({
    //     //   type_url: "/cosmos.bank.v1beta1.MsgSend",
    //     //   value: msgSendBytes,
    //     // });
    //     // const txBody = TxBody.create({
    //     //   messages: [msgSendWrapped],
    //     //   memo: "Some memo",
    //     //   timeoutHeight: Long.fromNumber(9999),
    //     //   extensionOptions: [],
    //     // });
    //     // const txBodyBytes = TxBody.encode(txBody).finish();
    
    //     // // Deserialization
    //     // const txBodyDecoded = TxBody.decode(txBodyBytes);
    //     // const msg = txBodyDecoded.messages[0];
    //     // assert(msg.value);
    //     // const msgSendDecoded = MsgSend.decode(msg.value);
    
    //     // // fromAddress and toAddress are now Buffers
    //     // expect(msgSendDecoded.fromAddress).toEqual(msgSend.fromAddress);
    //     // expect(msgSendDecoded.toAddress).toEqual(msgSend.toAddress);
    //     // expect(msgSendDecoded.amount).toEqual(msgSend.amount);
    //   });
    
    //   it("works with dynamically loaded proto files", () => {
    //     const { root } = protobuf.parse(demoProto);
    //     const typeUrl = "/demo.MsgDemo";
    //     const encoder = root.lookupType(getTypeName(typeUrl));
    //     const msgDemo = (encoder.create({
    //       example: "Some example text",
    //     }));
    //     const msgDemoBytes = encoder.encode(msgDemo).finish();
    //     const msgDemoWrapped = Any.create({
    //       type_url: typeUrl,
    //       value: msgDemoBytes,
    //     });
    //     const txBody = TxBody.create({
    //       messages: [msgDemoWrapped],
    //       memo: "Some memo",
    //       timeoutHeight: Long.fromNumber(9999),
    //       extensionOptions: [],
    //     });
    //     const txBodyBytes = TxBody.encode(txBody).finish();
    
    //     // Deserialization
    //     const txBodyDecoded = TxBody.decode(txBodyBytes);
    //     const msg = txBodyDecoded.messages[0];
    //     console.log(msg.type_url);
    //     console.log(msg.value);
    
    //     const decoder = root.lookupType(getTypeName(msg.type_url));
    //     const msgDemoDecoded = (decoder.decode(msg.value));
    //     // expect(msgDemoDecoded.example).toEqual(msgDemo.example);
    //     console.log(msgDemo.example);
    //   });
    
    //   it("works with dynamically loaded json files", () => {
    //     const root = protobuf.Root.fromJSON(demoJson);
    //     const typeUrl = "/demo.MsgDemo";
    //     const encoder = root.lookupType(getTypeName(typeUrl));
    //     const msgDemo = (encoder.create({
    //       example: "Some example text",
    //     }) as unknown) as MsgDemo;
    //     const msgDemoBytes = encoder.encode(msgDemo).finish();
    //     const msgDemoWrapped = Any.create({
    //       type_url: typeUrl,
    //       value: msgDemoBytes,
    //     });
    //     const txBody = TxBody.create({
    //       messages: [msgDemoWrapped],
    //       memo: "Some memo",
    //       timeoutHeight: Long.fromNumber(9999),
    //       extensionOptions: [],
    //     });
    //     const txBodyBytes = TxBody.encode(txBody).finish();
    
    //     // Deserialization
    //     const txBodyDecoded = TxBody.decode(txBodyBytes);
    //     const msg = txBodyDecoded.messages[0];
    //     assert(msg.type_url);
    //     assert(msg.value);
    
    //     const decoder = root.lookupType(getTypeName(msg.type_url));
    //     const msgDemoDecoded = (decoder.decode(msg.value) as unknown) as MsgDemo;
    //     expect(msgDemoDecoded.example).toEqual(msgDemo.example);
    //   });

});



function getTypeName(typeUrl) {
    const parts = typeUrl.split(".");
    return parts[parts.length - 1];
  }

const base64Matcher = /^(?:[a-zA-Z0-9+/]{4})*(?:|(?:[a-zA-Z0-9+/]{3}=)|(?:[a-zA-Z0-9+/]{2}==)|(?:[a-zA-Z0-9+/]{1}===))$/;

const faucet = {
  mnemonic:
    "economy stock theory fatal elder harbor betray wasp final emotion task crumble siren bottom lizard educate guess current outdoor pair theory focus wife stone",
  pubkey: {
    type: "tendermint/PubKeySecp256k1",
    value: "A08EGB7ro1ORuFhjOnZcSgwYlpe0DSFjVNUIkNNQxwKQ",
  },
  address: "cosmos1pkptre7fdkl6gfrzlesjjvhxhlc3r4gmmk8rs6",
};

const testVectors = [
  {
    sequence: 0,
    signedTxBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712650a4e0a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a02080112130a0d0a0575636f736d12043230303010c09a0c1a40c9dd20e07464d3a688ff4b710b1fbc027e495e797cfa0b4804da2ed117959227772de059808f765aa29b8f92edf30f4c2c5a438e30d3fe6897daa7141e3ce6f9",
    bodyBytes:
      "0a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d120731323334353637",
    signBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712650a4e0a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a02080112130a0d0a0575636f736d12043230303010c09a0c1a0c73696d642d74657374696e672001",
    signature:
      "c9dd20e07464d3a688ff4b710b1fbc027e495e797cfa0b4804da2ed117959227772de059808f765aa29b8f92edf30f4c2c5a438e30d3fe6897daa7141e3ce6f9",
  },
  {
    sequence: 1,
    signedTxBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a020801180112130a0d0a0575636f736d12043230303010c09a0c1a40525adc7e61565a509c60497b798c549fbf217bb5cd31b24cc9b419d098cc95330c99ecc4bc72448f85c365a4e3f91299a3d40412fb3751bab82f1940a83a0a4c",
    signBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a020801180112130a0d0a0575636f736d12043230303010c09a0c1a0c73696d642d74657374696e672001",
    bodyBytes:
      "0a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d120731323334353637",
    signature:
      "525adc7e61565a509c60497b798c549fbf217bb5cd31b24cc9b419d098cc95330c99ecc4bc72448f85c365a4e3f91299a3d40412fb3751bab82f1940a83a0a4c",
  },
  {
    sequence: 2,
    signedTxBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a020801180212130a0d0a0575636f736d12043230303010c09a0c1a40f3f2ca73806f2abbf6e0fe85f9b8af66f0e9f7f79051fdb8abe5bb8633b17da132e82d577b9d5f7a6dae57a144efc9ccc6eef15167b44b3b22a57240109762af",
    bodyBytes:
      "0a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d120731323334353637",
    signBytes:
      "0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2d636f736d6f7331706b707472653766646b6c366766727a6c65736a6a766878686c63337234676d6d6b38727336122d636f736d6f7331717970717870713971637273737a673270767871367273307a716733797963356c7a763778751a100a0575636f736d12073132333435363712670a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21034f04181eeba35391b858633a765c4a0c189697b40d216354d50890d350c7029012040a020801180212130a0d0a0575636f736d12043230303010c09a0c1a0c73696d642d74657374696e672001",
    signature:
      "f3f2ca73806f2abbf6e0fe85f9b8af66f0e9f7f79051fdb8abe5bb8633b17da132e82d577b9d5f7a6dae57a144efc9ccc6eef15167b44b3b22a57240109762af",
  },
];

export function makeRandomAddress() {
    return Bech32.encode("cosmos", Random.getBytes(20));
  }

function getTypeName(typeUrl) {
  const parts = typeUrl.split(".");
  return parts[parts.length - 1];
}
# JavaScript SDK Programming Guide [![npm](https://img.shields.io/npm/v/virgil-sdk.svg)](https://www.npmjs.com/package/virgil-sdk)

This guide is a practical introduction to creating apps for the Browser/Node.js that makes use of Virgil Security features. The code examples in this guide are written in JavaScript. 

In this guide you will find code for every task you need to implement in order to create an application using Virgil Security. It also includes a description of the main objects and functions. The aim of this guide is to get you up and running quickly. You should be able to copy and paste the code provided here into your own apps and use it with minumal changes.

## Table of Contents

* [Setting up your project](#setting-up-your-project)
* [User and App Credentials](#user-and-app-credentials)
* [Usage](#usage)
* [Creating a Virgil Card](#creating-a-virgil-card)
* [Get Virgil Card by Id](#get-virgil-card-by-id)
* [Search for Virgil Cards](#search-for-virgil-cards)
* [Validating Virgil Cards](#validating-virgil-cards)
* [Revoking a Virgil Card](#revoking-a-virgil-card)
* [Operations with Crypto Keys](#operations-with-crypto-keys)
  * [Generate Keys](#generate-keys)
  * [Import and Export Keys](#import-and-export-keys)
* [Encryption and Decryption](#encryption-and-decryption)
  * [Encrypt Data](#encrypt-data)
  * [Decrypt Data](#decrypt-data)
* [Generating and Verifying Signatures](#generating-and-verifying-signatures)
  * [Generating a Signature](#generating-a-signature)
  * [Verifying a Signature](#verifying-a-signature)
* [Fingerprint Generation](#fingerprint-generation)
* [Release Notes](#release-notes)

## Setting up your project

The Virgil SDK is provided as a package named *virgil-sdk*. The package is distributed via [npm](https://www.npmjs.com/) package management system.

### Target environments

SDK targets ECMAScript 5 compatible browsers and Node.js

### Installation

You can install Virgil SDK with npm

> Note that since SDK is still in beta you have to explicitly indicate that you want a beta version when installing from npm

```sh
npm install virgil-sdk@beta
```

Or get it from CDN
```html
<script src="https://cdn.virgilsecurity.com/packages/javascript/sdk/4.0.0-beta.0/virgil-sdk.min.js" crossorigin="anonymous"></script>
```

Or [download the source code](https://github.com/VirgilSecurity/virgil-sdk-javascript/releases)

## User and App Credentials

When you register an application on the Virgil developer's [dashboard](https://developer.virgilsecurity.com/dashboard), you are provided you with an *appID*, *appKey* and *accessToken*.

* **appID** uniquely identifies your application in our services, it is also used to identify the Public key part of your *appKey*

* **appKey** is a Private key that you use to sign requests that require authorization, e.g. creation and revocation of *Virgil Cards* (Public keys) in Virgil services. The *appKey* can also be used for other cryptographic operations that are part of your application logic. The *appKey* is generated at the time of application creation and it's your job to save it to a secure location.

* **accessToken** is a unique string that provides an authenticated secure access to Virgil services and is passed with each API call.


## Usage

### Connecting to Virgil

To start using Virgil services in your app, you must call a ```client``` factory function available through ```virgil``` namespace to create a `client` object that you can then use to create, revoke, search and get *Virgil Cards* (Public keys) from Virgil Services. 

### Initializing an API Client

The ```client``` factory function requires your application's *accessToken* as its first parameter

```javascript
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]");
```

it also has an optional second parameter `options` that you can use to overwrite default URLs of Virgil Services

```javascript
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]", {
  cardsBaseUrl: "https://cards.virgilsecurity.com",  // Virgil Cards service (Create, Revoke cards)
  cardsReadBaseUrl: "https://cards-ro.virgilsecurity.com", // Virgil Cards Read-Only service (Search, Get cards)
  identityBaseUrl: "https://identity.virgilsecurity.com" // Identity Service (Currently not in use)
});

```

### Using Crypto
The ```crypto``` object available through ```virgil``` namespace provides implementation of cryptographic operations such as hashing, signature generation and verification as well as encryption and decryption. It is initialized automatically when SDK is loaded. All api functions of ```virgil.crypto``` accept and return byte arrays as Node.js `Buffer`s. For browsers an implementation of `Buffer` module is provided by [this library](https://github.com/feross/buffer) and is avalable through ```virgil``` namespace ```Buffer``` property.

```javascript
var crypto = virgil.crypto;
```

## Creating a Virgil Card

*Virgil Card* is the main entity of Virgil services, it includes information about the user and their public key.

In order to create a Virgil Card that will only be available to your application (i.e. "application" scope card) you will need your *appID* and *appKey*.

```javascript
var appID = "[YOUR_APP_ID_HERE]";
var appKeyPassword = "[YOUR_APP_KEY_PASSWORD_HERE]";

// Browsers
var appKeyData = new virgil.Buffer("[YOUR_BASE64_ENCODED_APP_KEY_HERE]", "base64");

// Node
// var appKeyData = new Buffer("[YOUR_BASE64_ENCODED_APP_KEY_HERE]", "base64");

var appKey = crypto.importPrivateKey(appKeyData, appKeyPassword);
```

### Generate a new keypair using *virgil.crypto* object. 

```javascript
var aliceKeys = crypto.generateKeys();
```

### Prepare request

To make request object to create a Virgil Card use ```virgil.cardCreateRequest``` factory function. It accepts an `options` object with the following properties:
 - **public_key** - Public key associated with the Card as a `Buffer` (Required)
 - **scope** - Determines the *Virgil Card*'s scope that can be either *'global'* or *'application'*. Creating 'global' cards is *not supported* by this SDK currently so you may omit this parameter as it defaults to "application"
 - **identity_type** - Can be any string value (Required)
 - **identity** - Can be any string value (Required)
 - **data** - Associative array that contains application specific parameters. All keys must contain only latic characters and digits. The length of keys and values must not exceed 256 characters. Max number of entries is 16 (Optional)
 - **info** - Associative array with predefined keys that contain information about the device associated with the Card. The keys are always 'device_name' and 'device' and the values must not exceed 256 characters. (Optional)

```javascript
var exportedPublicKey = crypto.exportPublicKey(aliceKeys.publicKey);
var createCardRequest = virgil.cardCreateRequest({
      public_key: exportedPublicKey,
      identity: "alice",
      identity_type: "username"
    });
```

### Sign request

When you have the request object ready you must sign it with two private keys: the key of the Card being created and your application's key. Use `virgil.requestSigner` function to create an object you can use to sign the request

```javascript
var requestSigner = virgil.requestSigner(crypto);

requestSigner.selfSign(createCardRequest, aliceKeys.privateKey);
requestSigner.authoritySign(createCardRequest, appID, appKey);
```

### Publish a Virgil Card

```javascript
client.createCard(createCardRequest).then(function (aliceCard) {
  console.log(aliceCard);
});
```

## Get Virgil Card by Id
To get a single Virgil Card by its Id use ```client.getCard``` method. It accepts a single argument - `card_id` as a string

```javascript
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]");
var cardId = "[ID_OF_CARD_TO_GET]";
client.getCard(cardId).then(function (card) {
  console.log(card);
});
```

## Search for Virgil Cards
The ```client.searchCards``` method performs the `Virgil Card`s search by criteria. It accepts a single `options` parameter with the following properties:
- *identities* - An array of identity values to search for (Required)
- *identity_type* - Narrows the search by specific type of identity (Optional)
- *scope* - Specifies the scope to perform search on. Either 'global' or 'application' (Optional; defaults to "application")

```javascript
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]");
 
var criteria = {
  identities: [ "alice", "bob" ]
};
client.searchCards(criteria).then(function (cards) {
  console.log(cards);
});
```

## Validating Virgil Cards
This sample uses *built-in* ```cardValidator``` to validate cards. By default ```cardValidator``` validates only *Cards Service* signature. 

```javascript
// Get the crypto reference
var crypto = virgil.crypto;

var validator = virgil.cardValidator(crypto);

// Your can also add another Public Key for verification.
// validator.addVerifier("[VERIFIER_CARD_ID]", [VERIFIER_PUBLIC_KEY_AS_BUFFER]);

// Initialize service client
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]");
client.setCardValidator(validator);

var criteria = {
  identities: [ "alice", "bob" ]
};
client.searchCards(criteria)
.then(function (cards) {
  console.log(cards);
})
.catch(function (err) {
  if (err.invalidCards) {
    // err.invalidCards contains an array of Card objects that didn't pass validation
  }
});
```

## Revoking a Virgil Card

### Initialize required components

```javascript
var client = virgil.client("[YOUR_ACCESS_TOKEN_HERE]");
var crypto = virgil.crypto;
var requestSigner = virgil.requestSigner(crypto);
```

### Prepare *Application* credentials 
```javascript
var appID = "[YOUR_APP_ID_HERE]";
var appKeyPassword = "[YOUR_APP_KEY_PASSWORD_HERE]";

// Browsers
var appKeyData = new virgil.Buffer("[YOUR_BASE64_ENCODED_APP_KEY_HERE]", "base64");

// Node
// var appKeyData = new Buffer("[YOUR_BASE64_ENCODED_APP_KEY_HERE]", "base64");

var appKey = crypto.importPrivateKey(appKeyData, appKeyPassword);
```

### Prepare revocation request

To make a request object to revoke a Virgil Card use ```virgil.cardRevokeRequest``` factory function. It accepts an `options` object with the following properties:
 - *card_id* - Id of card to revoke (Required)
 - *revocation_reason* - The reason for revoking the card. Must be either "unspecified" or "compromised". Default is "unspecified"

```javascript
var cardId = "[YOUR_CARD_ID_HERE]";

var revokeRequest = virgil.cardRevokeRequest({
  card_id: cardId,
  revocation_reason: "compromised"
});
```

### Sign request

```javascript
requestSigner.authoritySign(revokeRequest, appID, appKey);
```

### Send request
```javascript
client.revokeCard(revokeRequest).then(function () {
  console.log('Revoked successfully');
});
```

## Operations with Crypto Keys

### Generate Keys
The following code sample illustrates key pair generation. The default algorithm is ed25519.

```javascript
 var aliceKeys = crypto.generateKeys();
```

To specify a different algorithm, pass one of the values of `virgil.crypto.KeyPairType` enumeration

```javascript
var aliceKeys = crypto.generateKeys(crypto.KeyPairType.FAST_EC_X25519) // Curve25519
```

### Import and Export Keys
All `virgil.crypto` api functions accept and return keys in an internal format. To get the raw key data as Buffer object use `exportPrivateKey` and `exportPublicKey` methods of `virgil.crypto` passing the appropriate internal key representation. To get the internal key representation out of the raw key data use `importPrivateKey` and `importPublicKey` respectively.

```javascript
 var exportedPrivateKey = crypto.exportPrivateKey(aliceKeys.privateKey);
 var exportedPublicKey = crypto.exportPublicKey(aliceKeys.publicKey);

 var privateKey = crypto.importPrivateKey(exportedPrivateKey);
 var publicKey = crypto.importPublicKey(exportedPublicKey);
```

## Encryption and Decryption
Data encryption using ECIES scheme with AES-GCM.

Generate keypair

```javascript
var crypto = virgil.crypto;
var aliceKeys = crypto.generateKeys();
```

### Encrypt Data

The `virgil.crypto.encrypt` method requires two parameters:
- *data* - The data to be encrypted as a Buffer
- *recipients* - Public key or an array of public keys to encrypt the data with

```javascript
// Browsers
var plaintext = new virgil.Buffer("Hello Bob!");

// Node.js
// var plaintext = new Buffer("Hello Bob!");


var cipherData = crypto.encrypt(plaintext, aliceKeys.publicKey);
```

### Decrypt Data

The `virgil.crypto.decrypt` method requires two parameters:
- *cipherData* - Encrypted data as a Buffer
- *privateKey* - The private key to decrypt with

```javascript
var decryptedData = crypto.decrypt(cipherData, aliceKeys.privateKey);
```

## Generating and Verifying Signatures
This section walks you through the steps necessary to use the `virgil.crypto` to generate a digital signature for data and to verify that a signature is authentic. 

Generate a new Public/Private keypair and *data* to be signed.

```javascript
var crypto = virgil.crypto;
var aliceKeys = crypto.generateKeys();

// The data to be signed with alice's Private key
// Browsers
var data = new virgil.Buffer("Hello Bob, How are you?");

// Node.js
// var data = new Buffer("Hello Bob, How are you?");
```

### Generating a Signature

Sign the SHA-384 fingerprint of data using your private key. To generate the signature, simply call one of the sign methods:

```javascript
var signature = crypto.sign(data, aliceKeys.privateKey);
```

### Verifying a Signature

Verify the signature of the SHA-384 fingerprint of data using Public key. The signature can now be verified by calling the verify method:

```javascript
 var isValid = crypto.verify(data, signature, alice.publicKey);
 ```
 
## Fingerprint Generation
The default algorithm for Fingerprint generation is SHA-256.
```javascript
var crypto = virgil.crypto;

// Browsers
var content = new virgil.Buffer("CONTENT_TO_CALCULATE_FINGERPRINT_OF");

// Node.js
// var content = new Buffer("CONTENT_TO_CALCULATE_FINGERPRINT_OF");

var fingerprint = crypto.calculateFingerprint(content);
```

## Release Notes
 - Please read the latest note here: [https://github.com/VirgilSecurity/virgil-sdk-javascript/releases](https://github.com/VirgilSecurity/virgil-sdk-javascript/releases)

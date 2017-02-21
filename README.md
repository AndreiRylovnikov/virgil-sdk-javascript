# Virgil Security JavaScript SDK
[![npm](https://img.shields.io/npm/v/virgil-sdk.svg)](npmjs)
[![Contact Support](https://img.shields.io/badge/contact-support-yellow.svg)][support]

[Installation](#installation) | [Get Started](#get-started) | [Initialization](#initialization) | [Documentation](#documentation) | [Support](#support)

[Virgil Security](https://virgilsecurity.com) provides a set of APIs for adding security to any application. In a few simple steps you can encrypt communication, securely store data, provide passwordless login, and ensure data integrity.

For a full overview head over to our Javascript [Get Started](js_getstarted) guides.

## Installation

This client can be used both __server-side__ in a Node application, and __client-side__ in a web browser.

### On a server

This module requires Node 0.12+ and can be installed via NPM.

```sh
npm install virgil-sdk --save
```

__Next:__ [Get Started with the JS SDK](js_getstarted).

### In the browser

The client-side SDK targets ECMAScript5+ compatible browsers.

```html
<script
src="https://cdn.virgilsecurity.com/packages/javascript/sdk/4.0.0/virgil-sdk.min.js"
crossorigin="anonymous"></script>
```

Alternatively [download the source code](https://github.com/VirgilSecurity/virgil-sdk-javascript/releases) into your application.

> __Warning:__
> Please note that in the browser environment we use Web Workers
to invoke some cryptographic operations. As a result, Chrome and Opera will raise an error unless the code is executed on an actual proper domain:
>
> `"Uncaught SecurityError: Script at '[blob url here]' cannot be accessed from origin 'null'."`

__Next:__ [Get Started with the JS SDK](js_getstarted).

## Getting Started: Encryption

Virgil Security makes it super easy to add encryption to any application. With our SDK you create a public [__Virgil Card__](#link_to_virgil_cards_guide) for every one of your users and devices. With these in place you can easily encrypt any data in the client.

```js
// find Alice's card(s)
virgil.cards.find(["alice"])
  .then(function (cards) {
    // encrypt the message using Alice's cards
    var message = "Hello Alice!";
    var encryptedMessage = virgil.encryptFor(message, cards);
    // transmit the message with your preferred technology
    transmitMessage(encryptedMessage.toString("base64"));
  });
```

The receiving user then uses their stored __private key__ to decrypt the message.


```js
// load Alice's Key from storage.
virgil.keys.load("alices_key_1", "mypassword")
  .then(function (key) {
    // decrypt the message using the key
    var data = key.decrypt(transferData).toString();
  });
```

__Next:__ [Encrypted communication](js_getstarted_encryption) is just one of the few things our SDK can do. Have a look at our guides on  [Encrypted Storage](js_getstarted_storage), [Data Integrity](js_getstarted_data_integrity) and [Passwordless Login](js_getstarted_passwordless_login) for more information.


## Initialization

To use this SDK you need to [sign up for an account](https://developer.virgilsecurity.com/account/signup) and create your first __application__. Make sure to save the __app id__, __private key__ and it's __password__. After this, create an __application token__ for your application to make authenticated requests from your clients.

### In the browser

To initialize the SDK in a web browser you will only need the __access token__ you created.

```js
var client = virgil.client("[ACCESS_TOKEN]");
```

> __Note:__ this client will have [limited capabilities](#guide_on_client_access_permissions). For example, it will be able to generate new __Cards__ but it will need a server-side client to transmit these to Virgil.

### On a server

To initialize the SDK on the server side we will need the __access token__, __app id__ and the __App Key__ you created on the [Developer Dashboard](#link_to_dashboard).

```javascript
var Virgil = require("virgil-sdk");
var appKey = require("fs").readFileSync("/path/to/app/key");
var virgil = Virgil({
    accessToken: "[ACCESS_TOKEN]",
    appCredentials: {
        appId: "[APP_ID]",
        appKeyData: appKey,
        appKeyPassword: "[APP_KEY_PASSWORD]"
    }
});
```

Next: [Learn more about our the different ways of initializing the Javascript SDK](js_guide_initialization) in our documentation.

## Documentation

Virgil Security has a powerful set of APIs, and the documentation is there to get you started today.

* [Get Started](#get_started_root) documentation
  * [Initialize the SDK](#initialize_root)
  * [Encrypted storage](#encrypted_storage)
  * [Encrypted communication](#encrypted_comms)
  * [Data integrity](#data_integrity)
  * [Passwordless login](#passwordless_login)
* [Guides](#guides_link)
  * [Virgil Cards](#guide_cards)
  * [Virgil Keys](#guide_keys)
* [Tutorials](#tutorials_link)

Alternatively, head over to our [Reference documentaton](#reference_docs) for in-depth information about every SDK method, it's arguments and return types.

## License

This library is released under the [3-clause BSD License](LICENSE).

## Support

Our developer support team is here to help you. You can find us on [Twitter](https://twitter.com/virgilsecurity) and [email](support).

[support]: mailto:support@virgilsecurity.com
[js_getstarted]: https://virgilsecurity.com/docs/js/get_started
[js_getstarted_encryption]: https://virgilsecurity.com/docs/js/encryption
[js_getstarted_storage]: https://virgilsecurity.com/docs/js/storage
[js_getstarted_data_integrity]: https://virgilsecurity.com/docs/js/data_integrity
[js_getstarted_passwordless_login]: https://virgilsecurity.com/docs/js/passwordless_login
[js_guide_initialization]: https://virgilsecurity.com/docs/js/guides/initialization
[npmjs]: https://www.npmjs.com/package/virgil-sdk

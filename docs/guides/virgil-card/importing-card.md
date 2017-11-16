# Importing Card

This guide shows how to import a **Virgil Card** from the string representation.

Set up your project environment before you begin to import a Virgil Card, with the [getting started](/docs/guides/configuration/client.md) guide.


To import the Virgil Card, we need to:

- Initialize the **Virgil SDK**

```javascript
var api = virgil.API("[YOUR_ACCESS_TOKEN_HERE]");
```

- Use the code below to import the Virgil Card from its string representation

```javascript
// import Virgil Card
var aliceCard = api.cards.import(exportedAliceCard);
```

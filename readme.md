# Litebase

A simple document oriented database for Node.js.
It uses standart fs module to interact with files.
Probably not scalable in current state.

## How to use

```js
let db = require('./litebase');
```

A storage folder will be created next to Litebase's index.js.

## Methods

### Get

.get method will find one document in a specific collection by a query. It will return a document object or undefined result:

```js
db.get('users', {login: 'newton'}, function(document)
{

});
```

.gets method will find all documents in a specific collection by a query. It will return an array of document objects:

```js
db.gets('users', {banned: true}, function(documents)
{

});
```

If no query provided, the previous methods will return a whole collection:

```js
db.get('users', function(collection)
{

});

// Or

db.gets('users', function(collection)
{

});
```

Simple query operators (!=, >, <, >=, <=) can be used:

```js
db.gets('profiles', {profile_privacy: {'!=': 'private'}, profile_views: {'>=': 1000}}, function(documents)
{

}););
```

### Save

### Delete

### File access
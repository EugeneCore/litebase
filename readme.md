# Litebase

A simple document oriented database for Node.js.
It uses a standart fs module to interact with files.
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
db.get('users', {login: 'newton'}, function(found_document)
{

});
```

.gets method will find all documents in a specific collection by a query. It will return an array of document objects:

```js
db.gets('users', {banned: true}, function(found_documents)
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
db.gets('profiles', {privacy: {'!=': 'private'}, views: {'>=': 1000}}, function(found_documents)
{

});
```

### Save

.save method will create a new document with a unique _id:

```js
let user = 
{
	login: 'newton',
	password: 'qwerty'
};

db.save('users', user, function(created_document)
{
	/*
		login: 'newton',
		password: 'qwerty',
		_id: 1657021467
	*/
});
```

.save method will update existing document if _id provided:

```js
db.get('users', {login: 'newton'}, function(found_user)
{
	/*
		login: 'newton',
		password: 'qwerty',
		_id: 1657021467
	*/

	found_user.password = '4815162342';

	db.save('users', found_user, function(updated_document)
	{

	});
});
```

.save method can be used with no callback:

```js
db.save('users', user);
```

### Delete

### File access
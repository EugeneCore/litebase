# Litebase

A simple document oriented database for Node.js.
It uses a standart fs module to interact with files.
Probably not scalable in the current state.

## Structure

Litebase works with collections of documents.

## How to use

```js
let db = require('./litebase');
```

At the moment of the first document saving, a storage folder will be created next to Litebase index.js.

## Methods

### Get

.get method will find one document in a specific collection by a query. It will return a document object or undefined result and a collection:

```js
db.get('users', {login: 'newton'}, function(found_document, collection)
{

});
```

.gets method will find all documents in a specific collection by a query. It will return an array of documents and a collection:

```js
db.gets('users', {banned: true}, function(found_documents, collection)
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
db.gets('profiles', {privacy: {'!=': 'private'}, views: {'>=': 1000}}, function(found_documents, collection)
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

db.save('users', user, function(created_document, updated_collection)
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
db.get('users', {login: 'newton'}, function(found_user, collection)
{
	/*
		login: 'newton',
		password: 'qwerty',
		_id: 1657021467
	*/

	found_user.password = '4815162342';

	db.save('users', found_user, function(updated_document, updated_collection)
	{

	});
});
```

.save method can be used with no callback:

```js
db.save('users', user);
```

### Delete

.delete method will delete all documents found by query:

```js
db.delete('users', {login: 'newton'}, function(updated_collection)
{

});
```

.delete method will delete entire collection if no query provided:

```js
db.delete('users', function(empty_collection)
{

});

// Or

db.delete('users', {}, function(empty_collection)
{

});
```

Both methods can be used with no callback:

```js
db.delete('users', {login: 'newton'});
db.delete('users');
```

Specific document can be easily deleted by its unique _id:

```js
db.get('users', {login: 'newton'}, function(found_user, collection)
{
	/*
		login: 'newton',
		password: '4815162342',
		_id: 1657021467
	*/

	db.delete('users', found_user);

	// Or

	db.delete('users', {_id: found_user._id});
});
```

## Files

.files methods give a direct access to any file in the storage folder.

### Get

.files.get will open a file by path and return its content as a string:

```js
db.files.get('users', function(file_content)
{

});
```

### Save

.files.save will create a new file or update an existing one:

```js
db.files.save('users', content, function(file_content)
{

});

// Or

db.files.save('users', content);
```

### Delete

.files.delete will delete a file by path:

```js
db.files.delete('users', function()
{

});

// Or

db.files.delete('users');
```

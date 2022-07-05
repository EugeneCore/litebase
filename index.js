/*///////////////////////////////////////////////*/

// Requires

let fs = require('fs');

/*///////////////////////////////////////////////*/

// Database

let database = {};

/*///////////////////////////////////////////////*/

// Queue control

database.queue =
{
	list: {}
};

database.queue.take = function(id, callback)
{
	if (database.queue.list[id])
	{
		setTimeout(database.queue.take, 10, id, callback);
	}
	else
	{
		database.queue.list[id] = true;
		callback();
	}
}

database.queue.free = function(id)
{
	delete database.queue.list[id];
}

/*///////////////////////////////////////////////*/

// File system

database.open_file = function(path, callback)
{
	path = __dirname + '/storage/' + path;

	database.queue.take(path, function()
	{
		fs.readFile(path, 'utf8', function(error, data)
		{
			database.queue.free(path);
			callback(data);
		});
	});
}

database.save_file = function(path, data, callback)
{
	path = __dirname + '/storage/' + path;
	data = data + '';

	database.queue.take(path, function()
	{
		database.create_file_directory(path, function()
		{
			fs.writeFile(path, data, 'utf8', function()
			{
				database.queue.free(path);
				callback(data);
			});
		});
	});
}

database.delete_file = function(path, callback)
{
	path = __dirname + '/storage/' + path;

	database.queue.take(path, function()
	{
		fs.unlink(path, function()
		{
			database.queue.free(path);
			callback('');
		});
	});
}

database.create_file_directory = function(path, callback)
{
	// Delete file name
	path = path.replace(/\/(?=[^\/]*$)\S+/, '');

	fs.mkdir(path, {recursive: true}, function()
	{
		callback();
	});
}

/*///////////////////////////////////////////////*/

// Get

database.get_collection = function(collection_name, callback)
{
	database.open_file(collection_name, function(collection)
	{
		callback(collection ? JSON.parse(collection) || []);
	});
}

database.get_document = function(collection_name, query, options, callback)
{
	let documents = [];

	database.get_collection(collection_name, function(collection)
	{
		let collection_length = collection.length;

		if (collection_length)
		{
			let query_length = Object.keys(query).length;

			for (let i = 0; i < collection_length; i++)
			{
				let matches = 0;
					
				for (let field in query)
				{
					let document_field = collection[i][field];
					let is_operator_field;

					for (let _field in query[field])
					{
						if (_field == '!=' && document_field != query[field][_field])
						{
							is_operator_field = true;
							matches++;
						}
						else if (_field == '>' && document_field > query[field][_field])
						{
							is_operator_field = true;
							matches++;
						}
						else if (_field == '>=' && document_field >= query[field][_field])
						{
							is_operator_field = true;
							matches++;
						}
						else if (_field == '<' && document_field < query[field][_field])
						{
							is_operator_field = true;
							matches++;
						}
						else if (_field == '<=' && document_field <= query[field][_field])
						{
							is_operator_field = true;
							matches++;
						}
					}

					if (!is_operator_field && document_field == query[field])
					{
						matches++;
					}
				}

				if (matches == query_length)
				{
					collection[i]._index = i;
					documents.push(collection[i]);

					if (!options.return_all_found)
					{
						break;
					}
				}
			}
		}

		if (options.return_all_found)
		{
			callback(documents, collection);
		}
		else
		{
			callback(documents[0], collection);
		}
	});
}

/*///////////////////////////////////////////////*/

// Save

database.save_collection = function(collection_name, collection, callback)
{
	if (collection.length)
	{
		database.save_file(collection_name, JSON.stringify(collection, null, '\t'), function()
		{
			callback(collection);
		});
	}
	else
	{
		database.delete_file(collection_name, function()
		{
			callback([]);
		});
	}
}

database.save_document = function(collection_name, document, callback)
{
	delete document._index;
	
	if (document._id)
	{
		// Update existed document

		database.queue.take(collection_name, function()
		{
			database.get_document(collection_name, {_id: document._id}, {return_all_found: false}, function(existed_document, collection)
			{
				if (existed_document)
				{
					collection[existed_document._index] = document;
				}
				else
				{
					collection.push(document);
				}

				database.save_collection(collection_name, collection, function()
				{
					database.queue.free(collection_name);
					callback(document, collection);
				});
			});
		});
	}
	else
	{
		// Add new document

		database.queue.take(collection_name, function()
		{
			database.get_collection(collection_name, function(collection)
			{
				document._id = Date.now() + '';
				collection.push(document);

				database.save_collection(collection_name, collection, function()
				{
					database.queue.free(collection_name);
					callback(document, collection);
				});
			});
		});
	}
}

/*///////////////////////////////////////////////*/

// Delete

database.delete_documents_by_query = function(collection_name, query, callback)
{
	database.queue.take(collection_name, function()
	{
		if (query._id) query = {_id: query._id};

		database.get_document(collection_name, query, {return_all_found: true}, function(documents, collection)
		{
			// Delete documents by indexes

			for (let i = 0; i < documents.length; i++)
			{
				collection.splice(documents[i]._index - i, 1);
			}

			database.save_collection(collection_name, collection, function()
			{
				database.queue.free(collection_name);
				callback(collection);
			});
		});
	});
}

database.delete_collection = function(collection_name, callback)
{
	database.queue.take(collection_name, function()
	{
		database.delete_file(collection_name, function()
		{
			database.queue.free(collection_name);
			callback([]);
		});
	});
}

/*///////////////////////////////////////////////*/

// Exports and security

function safe_callback(callback)
{
	if (typeof callback == 'function')
	{
		// Good callback
		return callback;
	}
	else if (callback)
	{
		// Invalid callback
		return function() {}
	}
	else
	{
		// Empty callback
		return function() {}
	}
}

/*///////////////////////////////////////////////*/

// Documents

// .get(collection_name, query, callback); - Return one document found by query AND collection
// .get(collection_name, callback); - Return collection

exports.get = function(collection_name, query, callback)
{
	if (typeof collection_name != 'string' || collection_name.length == 0)
	{
		// Invalid collection name
	}
	else if (typeof query == 'object' && typeof callback == 'function')
	{
		database.get_document(collection_name, query, {return_all_found: false}, callback);
	}
	else if (typeof query == 'function')
	{
		// Callback instead query
		database.get_collection(collection_name, query);
	}
}

// .gets(collection_name, query, callback); - Return array of documents found by query AND collection
// .gets(collection_name, callback); - Return collection

exports.gets = function(collection_name, query, callback)
{
	if (typeof collection_name != 'string' || collection_name.length == 0)
	{
		// Invalid collection name
	}
	else if (typeof query == 'object' && typeof callback == 'function')
	{
		if (Object.keys(query).length == 0)
		{
			// Query is empty. Return collection
			database.get_collection(collection_name, callback);
		}
		else
		{
			database.get_document(collection_name, query, {return_all_found: true}, callback);
		}
	}
	else if (typeof query == 'function')
	{
		// Callback instead query
		database.get_collection(collection_name, query);
	}
}

// .save(collection_name, document, callback); - Update document IF _id provided OR create new document IF he is not empty. Return saved document or nothing AND collection
// .save(collection_name, document); - Update document IF _id provided OR create new document IF he is not empty

exports.save = function(collection_name, document, callback)
{
	if (typeof collection_name != 'string' || collection_name.length == 0)
	{
		// Invalid collection name
	}
	else if (typeof document != 'object')
	{
		// Invalid document
	}
	else if (Object.keys(document).length == 0)
	{
		// Document is empty
		safe_callback(callback)({});
	}
	else
	{
		database.save_document(collection_name, document, safe_callback(callback));
	}
}

// .delete(collection_name, query, callback); - Delete documents found by query OR delete entire collection IF query is empty. Return collection
// .delete(collection_name, query); - Delete documents found by query OR delete entire collection IF query is empty
// .delete(collection_name, callback); - Delete entire collection. Return []
// .delete(collection_name); - Delete entire collection

exports.delete = function(collection_name, query, callback)
{
	if (typeof collection_name != 'string' || collection_name.length == 0)
	{
		// Invalid collection name
	}
	else if (typeof query == 'object' && Object.keys(query).length > 0)
	{
		// Query is not empty
		database.delete_documents_by_query(collection_name, query, safe_callback(callback));
	}
	else if (typeof query == 'object')
	{
		// Query is empty
		database.delete_collection(collection_name, safe_callback(callback));
	}
	else if (typeof query == 'function')
	{
		// Callback instead query
		database.delete_collection(collection_name, query);
	}
	else
	{
		// No query and no callback
		database.delete_collection(collection_name);
	}
}

/*///////////////////////////////////////////////*/

// Files

exports.files = {};

// .files.open(path, callback) - Open file. Return file

exports.files.open = function(path, callback)
{
	if (typeof path != 'string' || path.length == 0)
	{
		// Invalid path
	}
	else if (typeof callback != 'function')
	{
		// Invalid callback
	}
	else
	{
		database.open_file(path, callback);
	}
}

// .files.save(path, data, callback) - Save file. Return saved file
// .files.save(path, data) - Save file

exports.files.save = function(path, data, callback)
{
	if (typeof path != 'string' || path.length == 0)
	{
		// Invalid path
	}
	else if (typeof data != 'string')
	{
		// Invalid data
	}
	else
	{
		database.save_file(path, data, safe_callback(callback));
	}
}

// .files.delete(path, callback) - Delete file. Return ''
// .files.delete(path) - Delete file

exports.files.delete = function(path, callback)
{
	if (typeof path != 'string' || path.length == 0)
	{
		// Invalid path
	}
	else
	{
		database.delete_file(path, safe_callback(callback));
	}
}

/*///////////////////////////////////////////////*/
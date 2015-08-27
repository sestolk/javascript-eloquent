# Eloquent for SQLite in Javascript

## Story of origin
This is a class I wrote with which you can write [Eloquent](http://laravel.com/docs/eloquent) style Queries in Javascript that works with a SQLite database.
I wrote it for usage in [Cordova Apps](http://cordova.apache.org/) with the [Cordova SQLite Plugin](https://github.com/brodysoft/Cordova-SQLitePlugin).

## Environments in which to use
* [Cordova Apps](http://cordova.apache.org/) on mobile devices that support the [Cordova SQLite Plugin](https://github.com/brodysoft/Cordova-SQLitePlugin)

# Installation
Check the included [index.html](../index.html) for a live example and installation. It is fairly straightforward, but If you really don't know. You know where to find me!

# Usage

## Available Queries
Below you will find some examples of the available Queries. More will surely be added, but as far as I can see, these are the most important ones.

### Create table Queries
Examples:
``` javascript
var MarketModel = function ()
{
	//...
	this.createModel = function ( callback )
	{
		_this.createColumn('id', 'INTEGER')
			.createColumn('user_id', 'INTEGER')
			.createColumn('name', 'TEXT')
			.primaryKey(['id', 'user_id']) // Create a combined primary key
			.createTable(callback);
	};
	//...
};

new MarketModel().createModel(function(){});
```

### Select Queries
As you would expect from a normal Query, *__where__* aswell as *__orderBy__* clauses are optional and can be repeated as many times as needed. Order of calling is not important.

The *__first__*, *__get__* or *__all__* methods should be called last as they will return the results to your callback (2nd argument).
In the first argument you can define the columns that should be returned, an empty array will return **\*** (read: all) columns.

Examples:
``` javascript
// One result
// Query: "SELECT * FROM markets WHERE id = 5 ORDER BY id DESC LIMIT 1"
new MarketModel().where('id', '=', 5).orderBy('id', 'DESC').first([], function(){});

// or multiple results
// Query: "SELECT * FROM markets WHERE id = 5 ORDER BY id ASC"
new MarketModel().where('id', '=', 5).orderBy('id').get([], function(){});

// synonym for get
// Query: "SELECT id, name FROM markets ORDER BY id DESC"
new MarketModel().orderBy('id', 'DESC').all(['id', 'name'], function(){});
```

### Insert Query
Unlike with the Update Query, where and orderBy clauses are ignored. So there is no point of chaining them.

Examples:
```
// Query: "INSERT INTO markets (test, test1) VALUES ('1235', 'qwerty')"
new MarketModel().column('test', '1235').column('test1', 'qwerty').add(function (){});
```

**NOTE:** *__column__* clauses are optional and can be repeated as many times as needed.

### Update Query

Examples:
``` javascript
// These two examples will produce the same Query
// Query: "UPDATE markets SET test = '1235', test2 = 'qwerty' WHERE id = 5"
new MarketModel().set('test', '1235').set('test2', 'qwerty').where('id', '=', 5).update(function (){});
// Or
new MarketModel().set('test', '1235').set('test2', 'qwerty').update(function (){}, 5);
```

**NOTE:** *__set__* aswell as *__where__* and *__orderBy__* clauses are optional and can be repeated as many times as needed. Order of calling is not important.

### Remove Query

Examples:
``` javascript
// These two examples will produce the same Query
// Query: "DELETE FROM markets WHERE id = 5"
new MarketModel().where('id', '=', 5).remove(function(){});
// Or
new MarketModel().remove(function(){}, 5);
```

**NOTE:** *__where__* clauses are optional and can be repeated as many times as needed. *__orderBy__* clauses are ignored. Order of calling is not important.

## Future update(s)
* WhereIn, WhereNotIn clauses
* Use of auto incrementing columns
* Timestamps
* Soft deletion
* Record touching
* Raw Query
* Relationships

### Author(s)
* Sven Stolk
  * Usability Laboratory
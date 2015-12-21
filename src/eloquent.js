/**
 * Eloquent for SQLite in Javascript
 * http://git.u-lab.nl/Sven/eloquent-javascript
 *
 * This is a class I wrote with which you can write Eloquent style Queries in Javascript that works with a SQLite database.
 * I wrote it for usage in Cordova Apps with the Cordova SQLite Plugin.
 *
 * @company Usability Laboratory
 * @authors Sven Stolk
 * @requires isEmpty
 * @requires isDefined
 * @requires isArray
 *
 * @constructor
 *
 * @return {Eloquent}
 */
var Eloquent = function ()
{
	EloquentHelpers.call(this);

	var _this = this;

	this.showDebug = false;
	this.db = null;
	this.primary_key = 'id';
	this.table = '';

	// Builder Vars
	var query = '';
	var whereStarted = false;
	var whereQuery = '';
	var whereIsNested = false;
	var orderByStarted = false;
	var orderByQuery = '';
	var limitQuery = '';
	var setStarted = false;
	var setQuery = '';
	var joinStarted = false;
	var joinQuery = '';
	var columns = [];
	var parameters = [];
	var values = [];
	var createColumns = [];
	var createPrimaryKeys = [];
	var modelRelations = [];

	function setDatabase()
	{
		// Set this to your globally defined database
		// Prevents opening the database on each call
		_this.db = app.db;
	}

	/**
	 * Places quotes around every column to prevent accidental usage of keywords
	 *
	 * @param {string|Object} columns
	 *
	 * @returns {string|Object}
	 */
	function quoteColumns( columns )
	{
		var quoted, safe = ['*'], column, columnTable, table;

		if ( typeof columns === 'object' )
		{
			quoted = [];
			for ( var c = 0; c < columns.length; c++ )
			{
				table = '';
				column = columns[c];

				// Check for table reference
				if ( column.indexOf('.') > -1 )
				{
					columnTable = column.split('.');
					table = columnTable[0];
					column = columnTable[1];

					// "table".* or "table"."column"
					quoted.push(((safe.indexOf(column) > -1) ? '"' + table + '".' + column : '"' + table + '"."' + column + '"'));
				}
				else
				{
					quoted.push(((safe.indexOf(column) > -1) ? column : '"' + column + '"'));
				}
			}
		}
		else
		{
			quoted = (safe.indexOf(columns) > -1) ? columns : '"' + columns + '"';

			if ( columns.indexOf('.') > -1 )
			{
				columnTable = columns.split('.');
				table = columnTable[0];
				column = columnTable[1];

				// "table".* or "table"."column"
				quoted = ((safe.indexOf(column) > -1) ? '"' + table + '".' + column : '"' + table + '"."' + column + '"');
			}
		}

		return quoted;
	}

	/**
	 * Helps to see the result of the query
	 *
	 * @param {object} [columns=["*"]]
	 *
	 * @returns {string}
	 */
	function select( columns )
	{
		if ( isEmpty(columns) )
		{
			columns = ['*'];
		}

		columns = quoteColumns(columns);

		return "SELECT " + columns.join(', ') + " FROM " + _this.table + " " + joinQuery + " " + whereQuery + " " + orderByQuery + " " + limitQuery;
	}

	/**
	 * Call the relationships
	 *
	 * @param {object|Array} data
	 * @param {function} callback
	 */
	function callRelations( data, callback )
	{
		var modelIteration;

		modelIteration = new EloquentIterator();

		modelIteration.itemIteration(modelRelations, function ( rel, next )
		{
			// Call customer on current model
			if ( _this.isDefined(_this[rel]) )
			{
				_this[rel](data, rel, next);
			}
			else
			{
				console.log('Relation is not defined in your model');
			}
		});

		modelIteration.run(function ()
		{
			callback(data);
		});
	}

	/**
	 * Default callback for when a Query failes to execute
	 *
	 * @param {*} tx
	 * @param {object} e
	 */
	function _defaultErrorCallback( tx, e )
	{
		if ( typeof e === 'object' )
		{
			e.query = query;
			e.values = values;
		}

		console.log('An error occured:' + _this.json_encode(e));
	}

	/**
	 * Create a Create table statement
	 *
	 * @param callback
	 *
	 * @returns {Eloquent}
	 */
	this.createTable = function ( callback )
	{
		query = "CREATE TABLE IF NOT EXISTS " + _this.table;

		if ( !_this.isEmpty(createColumns) )
		{
			query += "(" + createColumns.join(',');

			if ( !_this.isEmpty(createPrimaryKeys) )
			{
				query += ", PRIMARY KEY (" + createPrimaryKeys.join(',') + ")";
			}

			query += ")";
		}

		this.raw(query, [], callback);

		return this;
	};

	/**
	 * Add a column to the create table query
	 *
	 * @param {string} name
	 * @param {string} type
	 * @param {boolean} [nullable=false] If column is allowed to be null
	 * @param {boolean} [autoIncrement=false] Should this column be auto incremented
	 * @param {*} [defaultValue=]
	 *
	 * @returns {Eloquent}
	 */
	this.createColumn = function ( name, type, nullable, autoIncrement, defaultValue )
	{
		var column;

		column = name + " " + type;
		nullable = nullable || false;
		autoIncrement = autoIncrement || false;
		defaultValue = defaultValue || null;

		if ( !nullable )
		{
			column += " NOT NULL";
		}

		if ( autoIncrement )
		{
			column += " PRIMARY KEY AUTOINCREMENT";
		}

		if ( defaultValue )
		{
			column += " DEFAULT(" + defaultValue + ")";
		}

		createColumns.push(column);

		return this;
	};

	/**
	 * Create a combined primary key
	 * !! Use only when you have no autoincrement columns (use createColumn for autoincrement column) !!
	 *
	 * @param {string|Array} name
	 *
	 * @returns {Eloquent}
	 */
	this.primaryKey = function ( name )
	{
		if ( _this.isArray(name) )
		{
			for ( var i = 0; i < name.length; i++ )
			{
				createPrimaryKeys.push(name[i]);
			}
		}
		else
		{
			createPrimaryKeys.push(name);
		}

		return this;
	};

	/**
	 * Flatten the results of a query into an array
	 * Because this is used after your results have been returned this functions is not part of the Eloquent class
	 *
	 * @param {object} data
	 * @param {string} key
	 * @param {string} valueKey
	 * @returns {object}
	 */
	this.columnize = function( data, key, valueKey )
	{
		var results = {};

		for ( var d in data )
		{
			if ( data.hasOwnProperty(d) )
			{
				var result = data[d];
				results[result[key]] = result[valueKey];
			}
		}

		return results;
	};

	/**
	 * Add a where clause to the Query
	 *
	 * @param {string} column
	 * @param {string} operator
	 * @param {string|Array|number} value
	 * @param {string} [statement="AND"]
	 *
	 * @return {Eloquent}
	 */
	this.where = function ( column, operator, value, statement )
	{
		if ( !whereStarted )
		{
			statement = statement || 'WHERE';

			whereQuery = statement + ' ';
			whereStarted = true;
		}
		else
		{
			statement = statement || 'AND';

			if ( !whereIsNested )
			{
				whereQuery += ' ' + statement + ' ';
			}
			else
			{
				whereIsNested = false;
			}
		}

		if ( _this.isArray(value) )
		{
			var parsedValues = [];
			for ( var v in value ) if ( value.hasOwnProperty(v) )
			{
				parsedValues.push('"' + value[v] + '"');
			}

			whereQuery += quoteColumns(column) + ' ' + operator + ' ( ' + parsedValues.join(',') + ' )';
		}
		else
		{
			whereQuery += quoteColumns(column) + ' ' + operator + ' ?';
			values.push(value);
		}

		return this;
	};

	/**
	 * Add an OR WHERE clause to the Query
	 *
	 * @param {string} column
	 * @param {string} operator
	 * @param {string|Array|number} value
	 *
	 * @return {Eloquent}
	 */
	this.orWhere = function(column, operator, value )
	{
		return this.where(column, operator, value, 'OR');
	};

	/**
	 * Add a nested where statement to the Query
	 *
	 * @param {function} wheres
	 * @param {string} [statement="AND"]
	 *
	 * @returns {Eloquent}
	 */
	this.whereNested = function ( wheres, statement )
	{
		statement = statement || 'AND';
		whereIsNested = true;

		if ( !whereStarted )
		{
			whereQuery = 'WHERE (';
			whereStarted = true;
		}
		else
		{
			whereQuery += ' ' + statement + ' (';
		}

		wheres(_this);

		whereQuery += ' )';

		return this;
	};

	/**
	 * Add an order by clause to the Query
	 *
	 * @param {string} column
	 * @param {string} [dir="ASC"]
	 *
	 * @returns {Eloquent}
	 */
	this.orderBy = function ( column, dir )
	{
		if ( _this.isEmpty(dir) )
		{
			dir = 'ASC';
		}

		if ( !orderByStarted )
		{
			orderByQuery = 'ORDER BY ';
			orderByStarted = true;
		}
		else
		{
			orderByQuery += ', ';
		}

		orderByQuery += quoteColumns(column) + ' ' + dir;

		return this;
	};

	/**
	 * Add an LIMIT clause to the Query
	 *
	 * @param {int} limitAmount
	 *
	 * @returns {Eloquent}
	 */
	this.limit = function ( limitAmount )
	{
		limitQuery = 'LIMIT ' + limitAmount;

		return this;
	};

	/**
	 * Retrieve the first record
	 *
	 * @param {string[]} [columns=["*"]]
	 * @param {function} callback
	 *
	 * @returns {Eloquent}
	 */
	this.first = function ( columns, callback )
	{
		var result;

		this.db.transaction(function ( tx )
		{
			query = select(columns) + " LIMIT 1";
			tx.executeSql(query, values, function ( tx, res )
				{
					if ( _this.isDefined(res) && res.rows.length > 0 )
					{
						result = res.rows.item(0);

						// We need to get some relations
						if ( !_this.isEmpty(modelRelations) )
						{
							callRelations(result, callback);
						}
						else
						{
							callback(result);
						}
					}
					else
					{
						callback([]);
					}
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Retrieve all records
	 *
	 * @param {string[]} [columns=["*"]]
	 * @param {function} callback
	 *
	 * @returns {Eloquent}
	 */
	this.get = function ( columns, callback )
	{
		var results = [];

		this.db.transaction(function ( tx )
		{
			query = select(columns);

			tx.executeSql(query, values, function ( tx, res )
				{
					if ( _this.isDefined(res) && res.rows.length > 0 )
					{
						for ( var r = 0; r < res.rows.length; r++ ) results.push(res.rows.item(r));

						// We need to get some relations
						if ( !_this.isEmpty(modelRelations) )
						{
							callRelations(results, callback);
						}
						else
						{
							callback(results);
						}
					}
					else
					{
						callback([]);
					}
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Retrieve all records, basically the same as get
	 *
	 * @param {string[]} [columns=["*"]]
	 * @param {function} callback
	 *
	 * @returns {Eloquent}
	 */
	this.all = function ( columns, callback )
	{
		return this.get(columns, callback);
	};

	/**
	 * (INNER) JOIN a table
	 *
	 * @param {string} table
	 * @param {string} first
	 * @param {string} operator
	 * @param {string} second
	 * @param {string} [type='INNER']
	 *
	 * @returns {Eloquent}
	 */
	this.join = function ( table, first, operator, second, type )
	{
		type = type || 'INNER';

		if ( !joinStarted )
		{
			joinQuery = type + ' JOIN ' + table + ' ON ' + quoteColumns(table + '.' + first) + ' ' + operator + ' ' + quoteColumns(_this.table + '.' + second);

			joinStarted = true;
		}
		else
		{
			joinQuery += ' ' + type + ' JOIN ' + table + ' ON ' + quoteColumns(table + '.' + first) + ' ' + operator + ' ' + quoteColumns(_this.table + '.' + second);
		}

		return this;
	};

	/**
	 * Delete the resulting record(s) from the table
	 *
	 * @param {function} [callback=]
	 * @param {number} [id=]
	 * @param {string} [column=]
	 *
	 * @returns {Eloquent}
	 */
	this.remove = function ( callback, id, column )
	{
		callback = callback || function () {};

		if ( _this.isDefined(id) )
		{
			if ( !_this.isDefined(column) )
			{
				column = this.primary_key;
			}

			this.where(column, '=', id);
		}

		this.db.transaction(function ( tx )
		{
			query = "DELETE FROM " + _this.table + " " + whereQuery;

			tx.executeSql(query, values, function ()
				{
					callback();
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Creates the column and values part of the Insert Query
	 *
	 * @param {string} column
	 * @param {(string|number)} value
	 *
	 * @returns {Eloquent}
	 */
	this.column = function ( column, value )
	{
		columns.push(quoteColumns(column));
		parameters.push('?');
		values.push(value);

		return this;
	};

	/**
	 * Add a new record
	 *
	 * @param {function} [callback=]
	 *
	 * @returns {Eloquent}
	 */
	this.add = function ( callback )
	{
		callback = callback || function () {};

		this.db.transaction(function ( tx )
		{
			query = "INSERT INTO " + _this.table + " (" + columns.join(', ') + ") VALUES (" + parameters.join(', ') + ")";

			tx.executeSql(query, values, function ( tx, res )
				{
					if ( _this.isDefined(res.rowsAffected) && res.rowsAffected > 0 )
					{
						callback(_this.isDefined(res.insertId) ? res.insertId : 0);
					}
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Creates the column = value part of the Update Query
	 *
	 * @param {string} column
	 * @param {(string|number)} value
	 *
	 * @return {Eloquent}
	 */
	this.set = function ( column, value )
	{
		if ( !setStarted )
		{
			setQuery = 'SET ';
			setStarted = true;
		}
		else
		{
			setQuery += ', ';
		}

		setQuery += quoteColumns(column) + ' = ?';
		values.push(value);

		return this;
	};

	/**
	 * Update a record
	 *
	 * @param {function} [callback=]
	 * @param {number} [id=]
	 * @param {string} [column=]
	 *
	 * @returns {Eloquent}
	 */
	this.update = function ( callback, id, column )
	{
		callback = callback || function () {};

		if ( _this.isDefined(id) )
		{
			if ( !_this.isDefined(column) )
			{
				column = this.primary_key;
			}

			this.where(column, '=', id);
		}

		this.db.transaction(function ( tx )
		{
			query = "UPDATE " + _this.table + " " + setQuery + " " + whereQuery;

			tx.executeSql(query, values, function ( tx, res )
				{
					if ( typeof res.rowsAffected !== 'undefined' && res.rowsAffected > 0 )
					{
						callback();
					}
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Empties/Truncate the table
	 *
	 * @param {function} [callback=]
	 *
	 * @returns {Eloquent}
	 */
	this.empty = function ( callback )
	{
		callback = callback || function () {};

		// Empty does not allow wheres
		whereQuery = '';

		return this.remove(callback);
	};

	/**
	 * Removes/Drops the table
	 *
	 * @param {function} [callback=]
	 *
	 * @returns {Eloquent}
	 */
	this.drop = function ( callback )
	{
		callback = callback || function () {};

		this.db.transaction(function ( tx )
		{
			query = "DROP TABLE IF EXISTS " + _this.table;

			tx.executeSql(query, [], function ()
				{
					callback();
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Run a complete (Raw) Query
	 *
	 * @param {string} query
	 * @param {object} [values=[]]
	 * @param {function} [callback=]
	 *
	 * @returns {Eloquent}
	 */
	this.raw = function ( query, values, callback )
	{
		var results = [];

		callback = callback || function () {};
		values = values || [];

		this.db.transaction(function ( tx )
		{
			tx.executeSql(query, values, function (tx, res)
				{
					if ( _this.isDefined(res) && res.rows.length > 0 )
					{
						for ( var r = 0; r < res.rows.length; r++ ) results.push(res.rows.item(r));

						// We need to get some relations
						if ( !_this.isEmpty(modelRelations) )
						{
							callRelations(results, callback);
						}
						else
						{
							callback(results);
						}
					}
					else
					{
						callback([]);
					}
				},
				function ( transaction, e )
				{
					_defaultErrorCallback(transaction, e);
				});
		});

		return this;
	};

	/**
	 * Conditional Query based on if a record exists, return result if exists
	 *
	 * @param {function} exists
	 * @param {function} notexists
	 * @param {object} [columns=['id']]
	 * @param {boolean} [forceNew=false]
	 *
	 * @returns {Eloquent}
	 */
	this.exists = function ( exists, notexists, columns, forceNew )
	{
		columns = columns || [this.primary_key];

		if ( forceNew )
		{
			notexists();

			return this;
		}

		this.first(columns, function ( result )
		{
			if ( _this.isEmpty(result) )
			{
				notexists();
			}
			else
			{
				exists(result);
			}
		});

		return this;
	};

	/**
	 * Conditional Query based on if records exists, return all results if exists
	 *
	 * @param {function} exists
	 * @param {function} notexists
	 * @param {object} [columns=['id']]
	 * @param {boolean} [forceNew=false]
	 *
	 * @returns {Eloquent}
	 */
	this.existsAll = function ( exists, notexists, columns, forceNew )
	{
		if ( forceNew )
		{
			notexists();

			return this;
		}

		this.get(columns, function ( results )
		{
			if ( _this.isEmpty(results) )
			{
				notexists();
			}
			else
			{
				exists(results);
			}
		});

		return this;
	};

	/**
	 *
	 * @param value
	 */
	this.id = function ( value )
	{
		return _this.where('id', '=', value);
	};

	/**
	 * Define which relationships should be applied to this model
	 *
	 * @param {string|Array} relations
	 *
	 * @returns {Eloquent}
	 */
	this.relations = function ( relations )
	{
		if ( _this.isArray(relations) )
		{
			for ( var i = 0; i < relations.length; i++ )
			{
				modelRelations.push(relations[i]);
			}
		}
		else
		{
			// I want these functions
			modelRelations.push(relations);
		}

		return this;
	};

	/**
	 * Create a Many/One-to-Many relationship
	 *
	 * @param {string} model
	 * @param {string} foreignKey
	 * @param {string} localKey
	 * @param {Array} args [data, key, callback]
	 * @param {Function} [statements=]
	 *
	 * @returns {Eloquent}
	 */
	this.hasMany = function ( model, foreignKey, localKey, args, statements )
	{
		var relation, localKeys, data, key, callback;

		data = args[0];
		key = args[1];
		callback = args[2];
		relation = new window[model];
		localKeys = _this.arrayColumn(data, localKey, true);

		if ( _this.isFunction(statements) )
		{
			relation = statements(relation);
		}

		return relation.where(foreignKey, 'IN', localKeys).get([], function ( items )
		{
			data = _this.mergeResults(data, items, localKey, foreignKey, key);

			callback();
		});
	};

	/**
	 * Create a Many/One-to-One relationship
	 *
	 * @param {string} model
	 * @param {string} foreignKey
	 * @param {string} localKey
	 * @param {Array} args [data, key, callback]
	 * @param {Function} [statements=]
	 *
	 * @returns {Eloquent}
	 */
	this.hasOne = function ( model, foreignKey, localKey, args, statements )
	{
		var relation, localKeys, data, key, callback;

		data = args[0];
		key = args[1];
		callback = args[2];
		relation = new window[model];
		localKeys = _this.arrayColumn(data, localKey, true);

		if ( _this.isFunction(statements) )
		{
			relation = statements(relation);
		}

		return relation.where(foreignKey, 'IN', localKeys).get([], function ( items )
		{
			data = _this.mergeResults(data, items, localKey, foreignKey, key, true);

			callback();
		});
	};

	/**
	 * Same as hasOne but with the keys switched around
	 *
	 * @param {string} model
	 * @param {string} foreignKey
	 * @param {string} otherKey
	 * @param {Array} args [data, key, callback]
	 * @param {Function} [statements=]
	 *
	 * @returns {Eloquent}
	 */
	this.belongsTo = function ( model, foreignKey, otherKey, args, statements )
	{
		return this.hasOne(model, otherKey, foreignKey, args, statements);
	};

	/**
	 *
	 * @param {string} model
	 * @param {string} table
	 * @param {string} localKey
	 * @param {string} foreignKey
	 * @param {string} otherKey
	 * @param {string} otherKey2
	 * @param {Array} args [data, key, callback]
	 * @param {Function} [statements=]
	 *
	 * @returns {Eloquent}
	 */
	this.belongsToMany = function ( model, table, localKey, foreignKey, otherKey, otherKey2, args, statements )
	{
		var relation, localKeys, data, key, callback;

		data = args[0];
		key = args[1];
		callback = args[2];
		relation = new window[model];
		localKeys = _this.arrayColumn(data, localKey, true);

		if ( _this.isFunction(statements) )
		{
			relation = statements(relation);
		}

		return relation.where(relation.table + '.' + foreignKey, 'IN', localKeys).join(table, otherKey, '=', otherKey2).get([], function ( items )
		{
			data = _this.mergeResults(data, items, localKey, foreignKey, key);

			callback();
		});
	};

	/**
	 * Debug some variable only when debug is enabled
	 *
	 * @param {*} variable
	 */
	this.debug = function ( variable )
	{
		if ( _this.showDebug )
		{
			console.log(variable);
		}
	};

	setDatabase();

	return this;
};

var EloquentHelpers = function()
{
	var _this = this;

	/**
	 *
	 * @param mixed_val
	 * @returns {*}
	 */
	this.json_encode = function ( mixed_val )
	{
		//       discuss at: http://phpjs.org/functions/json_encode/
		//      original by: Public Domain (http://www.json.org/json2.js)
		// reimplemented by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		//      improved by: Michael White
		//         input by: felix
		//      bugfixed by: Brett Zamir (http://brett-zamir.me)
		//        example 1: json_encode('Kevin');
		//        returns 1: '"Kevin"'

		/*
		 http://www.JSON.org/json2.js
		 2008-11-19
		 Public Domain.
		 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
		 See http://www.JSON.org/js.html
		 */
		var retVal, json = this.window.JSON;
		try
		{
			if ( typeof json === 'object' && typeof json.stringify === 'function' )
			{
				// Errors will not be caught here if our own equivalent to resource
				retVal = json.stringify(mixed_val);
				//  (an instance of PHPJS_Resource) is used
				if ( retVal === undefined )
				{
					throw new SyntaxError('json_encode');
				}
				return retVal;
			}

			var value = mixed_val;

			var quote = function ( string )
			{
				var escapable =
					/[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
				var meta = {
					// table of character substitutions
					'\b': '\\b',
					'\t': '\\t',
					'\n': '\\n',
					'\f': '\\f',
					'\r': '\\r',
					'"': '\\"',
					'\\': '\\\\'
				};

				escapable.lastIndex = 0;
				return escapable.test(string) ? '"' + string.replace(escapable, function ( a )
				{
					var c = meta[a];
					return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0)
						.toString(16))
						.slice(-4);
				}) + '"' : '"' + string + '"';
			};

			var str = function ( key, holder )
			{
				var gap = '';
				var indent = '    ';
				// The loop counter.
				var i = 0;
				// The member key.
				var k = '';
				// The member value.
				var v = '';
				var length = 0;
				var mind = gap;
				var partial = [];
				var value = holder[key];

				// If the value has a toJSON method, call it to obtain a replacement value.
				if ( value && typeof value === 'object' && typeof value.toJSON === 'function' )
				{
					value = value.toJSON(key);
				}

				// What happens next depends on the value's type.
				switch (typeof value)
				{
					case 'string':
						return quote(value);

					case 'number':
						// JSON numbers must be finite. Encode non-finite numbers as null.
						return isFinite(value) ? String(value) : 'null';

					case 'boolean':
					case 'null':
						// If the value is a boolean or null, convert it to a string. Note:
						// typeof null does not produce 'null'. The case is included here in
						// the remote chance that this gets fixed someday.
						return String(value);

					case 'object':
						// If the type is 'object', we might be dealing with an object or an array or
						// null.
						// Due to a specification blunder in ECMAScript, typeof null is 'object',
						// so watch out for that case.
						if ( !value )
						{
							return 'null';
						}
						if ( (this.PHPJS_Resource && value instanceof this.PHPJS_Resource) || (window.PHPJS_Resource &&
																							   value instanceof window.PHPJS_Resource) )
						{
							throw new SyntaxError('json_encode');
						}

						// Make an array to hold the partial results of stringifying this object value.
						gap += indent;
						partial = [];

						// Is the value an array?
						if ( Object.prototype.toString.apply(value) === '[object Array]' )
						{
							// The value is an array. Stringify every element. Use null as a placeholder
							// for non-JSON values.
							length = value.length;
							for ( i = 0; i < length; i += 1 )
							{
								partial[i] = str(i, value) || 'null';
							}

							// Join all of the elements together, separated with commas, and wrap them in
							// brackets.
							v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind +
																	']' : '[' + partial.join(',') + ']';
							gap = mind;
							return v;
						}

						// Iterate through all of the keys in the object.
						for ( k in value )
						{
							if ( Object.hasOwnProperty.call(value, k) )
							{
								v = str(k, value);
								if ( v )
								{
									partial.push(quote(k) + (gap ? ': ' : ':') + v);
								}
							}
						}

						// Join all of the member texts together, separated with commas,
						// and wrap them in braces.
						v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
						'{' + partial.join(',') + '}';
						gap = mind;
						return v;
					case 'undefined':
					// Fall-through
					case 'function':
					// Fall-through
					default:
						throw new SyntaxError('json_encode');
				}
			};

			// Make a fake root object containing our value under the key of ''.
			// Return the result of stringifying the value.
			return str('', {
				'': value
			});
		}
		catch (err)
		{
			if ( !(err instanceof SyntaxError) )
			{
				throw new Error('Unexpected error type in json_encode()');
			}
			this.php_js = this.php_js || {};
			// usable by json_last_error()
			this.php_js.last_error_json = 4;
			return null;
		}
	};

	/**
	 * Checks if the given value is defined
	 *
	 * @param value
	 * @returns {boolean}
	 */
	this.isDefined = function ( value )
	{
		return (typeof value !== 'undefined' && value !== null);
	};

	/**
	 * Checks if the given value is not empty
	 *
	 * @param value
	 * @returns {boolean}
	 */
	this.isEmpty = function( value )
	{
		if ( value && (typeof value === 'object' || value instanceof Array ) )
		{
			return (typeof value === 'object') ? (Object.keys(value).length <= 0) : (value.length <= 0);
		}

		return (!_this.isDefined(value) || value === '' || value === 0);
	};

	/**
	 * Checks if the given value is a function
	 *
	 * @param value
	 * @returns {boolean}
	 */
	this.isFunction = function( value )
	{
		return (typeof value === 'function' && value !== null);
	};

	/**
	 * Check if the given var is a real array
	 *
	 * @param o
	 * @returns {boolean}
	 */
	this.isArray = function( o )
	{
		return Object.prototype.toString.call(o) === '[object Array]';
	};

	/**
	 * Returns an array of only the given key
	 *
	 * @param {object|Array} array
	 * @param {string} key
	 * @param {boolean} [unique=false]
	 *
	 * @returns {object|Array}
	 */
	this.arrayColumn = function( array, key, unique )
	{
		var i,
			item,
			result = [];

		unique = unique || false;

		if ( !_this.isArray(array) )
		{
			if ( _this.isDefined(array[key]) )
			{
				result.push(array[key]);
			}
		}
		else
		{
			for ( i in array ) if ( array.hasOwnProperty(i) )
			{
				item = array[i];

				if ( _this.isDefined(item[key]) )
				{
					result.push(item[key]);
				}
			}
		}

		if ( unique )
		{
			return _this.arrayUnique(result);
		}

		return result;
	};

	/**
	 *
	 * @param arr
	 * @returns {Array}
	 */
	this.arrayUnique = function( arr )
	{
		function onlyUnique( value, index, self )
		{
			return self.indexOf(value) === index;
		}

		return arr.filter(onlyUnique)
	};

	/**
	 * Merge second into first based on the firstKey and secondKey
	 *
	 * @param {object|Array} first
	 * @param {object|Array} second
	 * @param {string} firstKey
	 * @param {string} secondKey
	 * @param {string} mergeKey
	 * @param {boolean} [forceObject=false]
	 */
	this.mergeResults = function( first, second, firstKey, secondKey, mergeKey, forceObject )
	{
		var i,
			item,
			firstItems = [],
			ii,
			item2,
			secondItems = [];

		forceObject = forceObject || false;

		if ( !_this.isArray(second) )
		{
			secondItems[second[secondKey]] = second;
		}
		else
		{
			for ( ii in second ) if ( second.hasOwnProperty(ii) )
			{
				item2 = second[ii];

				// secondKey exists in the object
				if ( _this.isDefined(item2[secondKey]) )
				{
					if ( forceObject )
					{
						secondItems[item2[secondKey]] = item2;
					}
					else
					{
						if ( !_this.isDefined(secondItems[item2[secondKey]]) )
						{
							secondItems[item2[secondKey]] = [];
						}

						secondItems[item2[secondKey]].push(item2);
					}
				}
			}
		}

		if ( !_this.isArray(first) )
		{
			first[mergeKey] = secondItems[first[firstKey]];

			return first;
		}
		else
		{
			for ( i in first ) if ( first.hasOwnProperty(i) )
			{
				item = first[i];

				item[mergeKey] = [];

				if ( _this.isDefined(secondItems[item[firstKey]]) )
				{
					item[mergeKey] = secondItems[item[firstKey]];
				}

				firstItems.push(item);
			}
		}

		return firstItems;
	}
};

var EloquentIterator = function()
{
	EloquentHelpers.call(this);

	var _this = this;

	this.i = 0;
	this.data = [];
	this.onComplete = null;

	/**
	 * Calls the next iteration
	 */
	function callIteration()
	{
		if ( !_this.isEmpty(_this.data) && !_this.isEmpty(_this.data[_this.i]) )
		{
			_this.data[_this.i].call(_this, function ()
			{
				_this.i++;

				callIteration();
			});
		}
		else
		{
			_this.onComplete();
		}
	}

	/**
	 * Add data to the iteration
	 *
	 * @param {function} fn
	 */
	this.addIteration = function ( fn )
	{
		this.data.push(fn);

		return this;
	};

	/**
	 *
	 * @param {object} items
	 * @param {function} fn
	 */
	this.itemIteration = function ( items, fn )
	{
		var i, item, itemIterator = _this;

		if ( _this.isDefined(items) && items.length > 0 )
		{
			for ( i in items ) if ( items.hasOwnProperty(i) )
			{
				item = items[i];

				itemIterator = (function ( item, i, itemIterator )
				{
					itemIterator.addIteration(function ( next )
					{
						fn(item, next, i);
					});

					return itemIterator;
				})(item, i, itemIterator);
			}
		}

		return this;
	};

	/**
	 * Run the iterations and call the complete callback on complete
	 *
	 * @param {function} [complete=]
	 */
	this.run = function ( complete )
	{
		_this.onComplete = complete || function () {};

		callIteration();
	};

	return this;
};
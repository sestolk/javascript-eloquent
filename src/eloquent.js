/**
 * Eloquent for SQLite in Javascript
 *
 * This is a class I wrote with which you can write Eloquent style Queries in Javascript that works with a SQLite database.
 * I wrote it for usage in Cordova Apps with the Cordova SQLite Plugin.
 *
 * @company Usability Laboratory
 * @authors Sven Stolk
 *
 * @constructor
 *
 * @return {Eloquent}
 */
function Eloquent()
{
	this.db = app.Database;
	this.primary_key = 'id';
	this.timestamps = true;
	this.table = '';

	/**
	 * End of Statement
	 * Resets/Initializes variables for the Builder
	 *
	 * @constructor
	 */
	this.EoS = function()
	{
		// Builder Vars
		this.query = '';
		this.whereStarted = false;
		this.whereQuery = '';
		this.orderByStarted = false;
		this.orderByQuery = '';
		this.setStarted = false;
		this.setQuery = '';
		this.columns = [];
		this.parameters = [];
		this.values = [];
	};

	this.EoS();

	return this;
}

/**
 * Add a where clause to the Query
 *
 * @param {string} column
 * @param {!string} [operator="="]
 * @param {string|number} value
 * @param {string} [statement="AND"]
 *
 * @return {Eloquent}
 */
Eloquent.prototype.where = function(column, operator, value, statement)
{
	if(typeof statement === 'undefined')
	{
		statement = 'AND';
	}

	if(!this.whereStarted)
	{
		this.whereQuery = 'WHERE ';
		this.whereStarted = true;
	}
	else
	{
		this.whereQuery += ' ' + statement + ' ';
	}

	this.whereQuery += column + ' ' + operator + ' ?';
	this.values.push(value);

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
Eloquent.prototype.orderBy = function(column, dir)
{
	if(typeof dir === 'undefined')
	{
		dir = 'ASC';
	}

	if(!this.orderByStarted)
	{
		this.orderByQuery = 'ORDER BY ';
		this.orderByStarted = true;
	}
	else
	{
		this.orderByQuery += ', ';
	}

	this.orderByQuery += column + ' ' + dir;

	return this;
};

/**
 * Helps to see the result of the query
 *
 * @param {string[]} [columns=["*"]]
 *
 * @returns {string}
 */
Eloquent.prototype.select = function(columns)
{
	if(typeof columns === 'undefined' || columns.length == 0)
	{
		columns = ['*'];
	}

	return "SELECT " + columns.join(', ') + " FROM " + this.table + " " + this.whereQuery + " " + this.orderByQuery;
};

/**
 * Retrieve the first record
 *
 * @param {string[]} [columns=["*"]]
 * @param {function} callback
 *
 * @returns {Eloquent}
 */
Eloquent.prototype.first = function(columns, callback)
{
	var _this = this;

	this.db.transaction(function (tx)
	{
		tx.executeSql(_this.select(columns) + " LIMIT 1", _this.values, function (tx, res)
			{
				callback(res.rows.item(0));
			},
			_this._defaultErrorCallback);
	});

	this.EoS();

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
Eloquent.prototype.get = function(columns, callback)
{
	var _this = this;

	this.db.transaction(function (tx)
	{
		tx.executeSql(_this.select(columns), _this.values, function (tx, res)
			{
				callback(res.rows);
			},
			_this._defaultErrorCallback);
	});

	this.EoS();

	return this;
};

/**
 * Retrieve all records, basicly the same as get
 *
 * @param {string[]} [columns=["*"]]
 * @param {function} callback
 *
 * @returns {Eloquent}
 */
Eloquent.prototype.all = function(columns, callback)
{
	return this.get(columns, callback);
};

/**
 * Delete the resulting record(s) from the table
 *
 * @param {function} callback
 * @param {number} [id=]
 * @param {string} [column=]
 *
 * @returns {Eloquent}
 */
Eloquent.prototype.delete = function(callback, id, column)
{
	var _this = this;

	if(typeof id !== 'undefined')
	{
		if(typeof column === 'undefined')
		{
			column = this.primary_key;
		}

		this.where(column, '-', id);
	}

	this.query = "DELETE FROM " + this.table + " " + this.whereQuery;

	this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				callback();
			},
			_this._defaultErrorCallback);
	});

	this.EoS();

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
Eloquent.prototype.column = function(column, value)
{
	this.columns.push(column);
	this.parameters.push('?');
	this.values.push(value);

	return this;
};

/**
 * Add a new record
 *
 * @param {function} callback
 *
 * @returns {Eloquent}
 */
Eloquent.prototype.add = function(callback)
{
	var _this = this;

	this.query = "INSERT INTO " + this.table + " (" + this.columns.join(', ') + ") VALUES (" + this.parameters.join(', ') + ")";

	this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				if(typeof res.rowsAffected !== 'undefined' && res.rowsAffected > 0)
				{
					callback();
				}
			},
			_this._defaultErrorCallback);
	});

	this.EoS();

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
Eloquent.prototype.set = function(column, value)
{
	if(!this.setStarted)
	{
		this.setQuery = 'SET ';
		this.setStarted = true;
	}
	else
	{
		this.setQuery += ', ';
	}

	this.setQuery += column + ' = ?';
	this.values.push(value);

	return this;
};

/**
 * Update a record
 *
 * @param {function} callback
 * @param {number} [id=]
 * @param {string} [column=]
 *
 * @returns {Eloquent}
 */
Eloquent.prototype.update = function(callback, id, column)
{
	var _this = this;

	if(typeof id !== 'undefined')
	{
		if(typeof column === 'undefined')
		{
			column = this.primary_key;
		}

		this.where(column, '-', id);
	}

	this.query = "UPDATE " + this.table + " " + this.setQuery + " " + this.whereQuery;

	this.db.transaction(function (tx)
	{
		tx.executeSql(_this.query, _this.values, function (tx, res)
			{
				if(typeof res.rowsAffected !== 'undefined' && res.rowsAffected > 0)
				{
					callback();
				}
			},
			_this._defaultErrorCallback);
	});

	this.EoS();

	return this;
};

/**
 * Default callback for when a Query failes to execute
 *
 * @param e
 */
Eloquent.prototype._defaultErrorCallback = function(e)
{
	console.log('An error occured:' + e.message);
};

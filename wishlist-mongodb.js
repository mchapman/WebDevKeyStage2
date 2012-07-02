var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

WishlistProvider = function(host, port, dbname, username, password) {
  var client = new Db(dbname, new Server(host, port, {auto_reconnect: true}, {}));
  this.db = client;
  client.open(function(err, p_client){
	  client.authenticate(username, password, function(err, p_client) {
		if (err) console.log(err);	  
	  });
  });
};

WishlistProvider.prototype.getCollection= function(callback) {
  this.db.collection('Wishlists', function(error, Wishlist_collection) {
    if( error ) callback(error);
    else callback(null, Wishlist_collection);
  });
};

WishlistProvider.prototype.find = function(criteria, debug, callback) {
    this.getCollection(function(error, Wishlist_collection) {
      if( error ) callback(error)
      else {
        if (!debug) {
            criteria.removed_at = { $exists : false }
        }
        if (criteria._id) {
            criteria._id = Wishlist_collection.db.bson_serializer.ObjectID.createFromHexString(criteria._id)
        }
        Wishlist_collection.find(criteria).toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
        });
      }
    });
};

WishlistProvider.prototype.save = function(wishes, callback) {
    this.getCollection(function(error, Wishlist_collection) {
      if( error ) callback(error)
      else {
        if( typeof(wishes.length)=="undefined")
          wishes = [wishes];

        for( var i =0;i< wishes.length;i++ ) {
          wish = wishes[i];
          wish.created_at = new Date();
        }

        Wishlist_collection.insert(wishes, function() {
          callback(null, wishes);
        });
      }
    });
};

WishlistProvider.prototype.update = function(id, wish, callback) {
    this.getCollection(function(error, Wishlist_collection) {
        if( error ) callback( error );
        else {
            Wishlist_collection.update(
                {_id: Wishlist_collection.db.bson_serializer.ObjectID.createFromHexString(id)},
                {"$set": wish},
                {},
                function(error){
                    if( error ) callback(error);
                });
        }
    });
};

WishlistProvider.prototype.delete = function(id, callback) {
    this.getCollection(function(error, Wishlist_collection) {
        if( error ) callback( error );
        else {
            Wishlist_collection.remove(
                {_id: Wishlist_collection.db.bson_serializer.ObjectID.createFromHexString(id)},
                function(err) {
                    if(err) callback(err)
                });
        }
    });
};

WishlistProvider.prototype.remove = function(id, reason, callback) {
    this.getCollection(function(error, Wishlist_collection) {
        if( error ) callback( error );
        else {
            Wishlist_collection.update(
                {_id: Wishlist_collection.db.bson_serializer.ObjectID.createFromHexString(id)},
                {"$set": {reason_removed: reason, removed_at: new Date()}},
                {},
                function(error, article){
                    if( error ) callback(error);
                    else callback(null, article)
                });
        }
    });
};

WishlistProvider.prototype.restore = function(id, callback) {
    this.getCollection(function(error, Wishlist_collection) {
        if( error ) callback( error );
        else {
            Wishlist_collection.update(
                {_id: Wishlist_collection.db.bson_serializer.ObjectID.createFromHexString(id)},
                {"$unset": {reason_removed: 1, removed_at: 1}},
                {},
                function(error, article){
                    if( error ) callback(error);
                    else callback(null, article)
                });
        }
    });
};

exports.WishlistProvider = WishlistProvider;

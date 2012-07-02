/**
 * Module dependencies
 */

var express = require('express');
var WishlistProvider = require('./wishlist-mongodb').WishlistProvider;

var app = module.exports = express.createServer();

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.enable('jsonp callback');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(require('stylus').middleware({ src:__dirname + '/public' }));
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

var WishlistProvider = new WishlistProvider(process.env.WDKS2_HOST, parseInt(process.env.WDKS2_PORT,10),
    process.env.WDKS2_DBNAME, process.env.WDKS2_USERNAME, process.env.WDKS2_PASSWORD);

app.get('/', function (req, res) {
    res.render('readme.jade', { locals:{
        title:'Introduction'
    }
    });
});

app.get('/user/all/:debug?', function (req, res) {
    var debug = (req.params.debug === 'debug')
    WishlistProvider.find({}, debug, function (error, docs) {
        res.render('index.jade', { locals:{
            title:'All Wishes',
            Wishlist:docs
        }
        });
    })
});

app.get('/user/:name.:format?/:debug?', function (req, res) {
    var userName = req.params.name
    var debug = (req.params.debug === 'debug')
    WishlistProvider.find({wisher:userName}, debug, function (error, docs) {
        if (req.params.format === 'json') {
            res.json(docs);
        } else {
            res.render('index.jade', { locals:{
                title:'Wishes for ' + userName,
                Wishlist:docs
            }
            });
        }
    })

});

app.get('/wish/new', function (req, res) {
    res.render('wish_form.jade', { locals:{
        title:'New Wish',
        wish: {},
        btn_text:'Add this Wish'
    }
    });
});

app.post('/wish/new', function (req, res) {
    WishlistProvider.save({
        wisher:req.param('wisher'),
        description:req.param('description'),
        url:req.param('url'),
        imgUrl:req.param('imgUrl'),
        price:req.param('price')
    }, function (error, docs) {
        res.redirect('/')
    });
});

app.get('/wish/:id/remove', function (req, res) {
    WishlistProvider.remove(req.params.id, req.param('reason'), function (error, docs) {
        res.send(req.params.id + ' successfully removed')
    });
});

app.get('/wish/:id/restore', function (req, res) {
    WishlistProvider.restore(req.params.id, function (error, docs) {
        res.send(req.params.id + ' successfully restored')
    });
});

app.get('/wish/:id/edit', function (req, res) {
    WishlistProvider.find({_id: req.params.id}, true, function (error, doc) {
        if (error || typeof doc[0] === "undefined") {
            res.send('No such wish found on the system: ' + req.params.id + '   ' + error)
        }
        else {
            res.render('wish_form.jade', { locals:{
                title:'Edit Wish',
                wish: doc[0],
                btn_text:'Save this Wish'}});
        }
    });
});

app.post('/wish/:id/edit', function (req, res) {
    WishlistProvider.update(req.params.id,
        {
        wisher:req.param('wisher'),
        description:req.param('description'),
        url:req.param('url'),
        imgUrl:req.param('imgUrl'),
        price:req.param('price')
        }, function (error) {
        res.send(error)
    });
    res.redirect('/')
});

app.del('/wish/:id', function (req, res) {
    WishlistProvider.delete(req.params.id, function (err) {
        if (err) {
            req.flash('error', 'Unable to delete wish ' + req.params.id)
        }
    });
    res.redirect('/')
})

var port;
port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);



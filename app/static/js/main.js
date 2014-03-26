require.config({
    paths: {
        'jquery': 'lib/jquery.min',
        'underscore': 'lib/underscore',
        'backbone': 'lib/backbone.min',
        'bootstrap': 'lib/bootstrap.min',
        'd3': 'lib/d3.v3.min',
        'jquery-ui': 'lib/jquery-ui-1.10.2.custom'
    },
    shim: {
        'jquery-ui': {
            exports: '$',
            deps: ['jquery']
        },
        'd3': {
            exports: 'd3'
        },
        'bootstrap': {
            exports: 'bootstrap',
            deps: ['jquery']
        }
    }
});

require([
    'bootstrap',
    'jquery-ui',
    'app',
    'router'
],
function(bootstrap, jqui, app, Router){
    app.router = new Router();

    Backbone.history.start();

    // Directly show the login popup if the user is not authenticated
    if(!(AUTHENTICATED_USER)){
        app.router.navigate('#login', {trigger: true});
    }
});

define([
    'jquery',
    'underscore',
    'backbone'
],
function($, _, Backbone){
    var app = {
        vent: _.extend({}, Backbone.Events)
    };

    return app;
});
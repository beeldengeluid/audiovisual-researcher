define([
    'jquery',
    'underscore',
    'backbone',
    'app'
],
function($, _, Backbone, app){
    var Logging = Backbone.View.extend({
        initialize: function(options){
            this.buffer = [];

            var self = this;
            _.each(LOG_EVENTS, function(event_type){
                app.vent.on('Logging:' + event_type, self.logEvent, self);
            });

            // Check the buffer every n miliseconds to see if we can send some
            // log events to ES
            setInterval(function(){
                var events = self.buffer.slice();
                if(events.length > 0){
                    self.buffer.length = 0;
                    self.model.logUsage(events);
                    console.log(events);
                }
            }, 5000);
        },

        logEvent: function(event){
            event.timestamp_ms = new Date().getTime();
            event.screen_size = {
                width: screen.width,
                height: screen.height
            };
            event.window_size = {
                width: $(window).width(),
                height: $(window).height()
            };

            this.buffer.push(event);
        }

    });

    return Logging;

});

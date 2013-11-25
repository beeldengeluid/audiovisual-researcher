define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../../templates/search/query_properties.html'
],
function($, _, Backbone, queryPropertiesTemplate){
    var QueryPropertiesView = Backbone.View.extend({
        events: {
        },

        initialize: function(){
            this.model.on('change:hits', this.render, this);
        },

        render: function(){
            if (DEBUG) console.log('QueryPropertiesView:render');

            this.$el.html(_.template(queryPropertiesTemplate, {
                totalHits: this.model.get('totalHits'),
                queryTimeMs: this.model.get('queryTimeMs')
            }));
        }
    });

    return QueryPropertiesView;
});
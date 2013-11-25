define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../../templates/search/results_list.html'
],
function($, _, Backbone, app, resultsListTemplate){
    var ResultsListView = Backbone.View.extend({
        events: {
            'click li a': 'logClick'
        },

        initialize: function(){
            // Control visibility on init. Element is shown on first query.
            this.is_visible = true;
            app.vent.once('QueryInput:input', this.toggleVisibility, this);

            this.model.on('change:hits', this.render, this);
            this.model.on('change:hits', this.logResults, this);
        },

        render: function(){
            if (DEBUG) console.log('ResultsListView:render');

            this.$el.html(_.template(resultsListTemplate, {
                hits: this.model.get('hits')
            }));

            return this;
        },

        logResults: function(){
            var docIDs = _.map(this.model.get('hits'), function(hit){ return hit._id; });
            app.vent.trigger('Logging:results', {
                action: 'results',
                modelName: this.model.get('name'),
                docIDs: docIDs
            });
        },

        logClick: function(e){
            var docID = e.target.dataset.id;
            app.vent.trigger('Logging:clicks', {
                action: 'view_document',
                docID: docID
            });
        },

        toggleVisibility: function(){
            if (DEBUG) console.log('ResultsListView:toggleVisibility');

            if(this.is_visible){
                this.$el.parent().hide();
                this.is_visible = false;
            }
            else {
                this.$el.parent().show();
                this.is_visible = true;
            }

            return this;
        }
    });

    return ResultsListView;
});

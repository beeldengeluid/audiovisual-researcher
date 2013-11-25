define([
    'jquery',
    'underscore',
    'backbone',
    'app',
    'text!../../templates/help.html'
],
function($, _, Backbone, app, querySyntaxTemplate){
    var QuerySyntaxView = Backbone.View.extend({
        parent: $('#main'),
        id: 'help',

        initialize: function(){
            this.el = $(this.el);
            this.parent.append(this.el);
        },

        render: function(){
            var self = this;
            if(DEBUG) console.log('QuerySyntaxView:render');
            this.$el.html(_.template(querySyntaxTemplate));

            // Get the about JSON document
            $.get(HELP_PAGE_CONTENT_URL, function(data){
                self.renderHelpText(data);
            });

            return this;
        },

        renderHelpText: function(data){
            if (DEBUG) console.log('AboutView:renderAboutText');
            this.$el.find('h1').html(data.title);
            this.$el.find('#helptext').html(data.maintext);
            this.$el.find('#querysyntax').html(data.table);
        }
    });

    return QuerySyntaxView;
});

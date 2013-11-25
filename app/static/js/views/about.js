define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'text!../../templates/about.html'
],
function($, _, Backbone, d3, aboutTemplate){
    var AboutView = Backbone.View.extend({
        parent: $('#main'),
        id: 'about',

        initialize: function(options){
            var self = this;

            this.el = $(this.el);
            this.parent.append(this.el);

            this.numberFormat = d3.format(',0f');
            this.dateFormat = d3.time.format('%e %B %Y');
            // Get the about JSON document
            $.get(ABOUT_PAGE_CONTENT_URL, function(data){
                self.renderAboutText(data);
            });

            this.stats = {};
            this.model.on('change:totalDocs', function(){
                self.stats.totalDocs = self.model.get('totalDocs');
                self.renderIndexStats();
            });
            this.model.on('change:firstBroadcastDate', function(){
                self.stats.firstBroadcastDate = self.model.get('firstBroadcastDate');
                self.stats.lastBroadcastDate = self.model.get('lastBroadcastDate');
                self.renderIndexStats();
            });
            this.model.on('change:docsWithTweetsCount', function(){
                self.stats.docsWithTweetsCount = self.model.get('docsWithTweetsCount');
                self.renderIndexStats();
            });
            this.model.on('change:docsWithSubtitleCount', function(){
                self.stats.docsWithSubtitleCount = self.model.get('docsWithSubtitleCount');
                self.renderIndexStats();
            });
            this.model.getTotalDocCount();
            this.model.getFirstLastDocDates();
            this.model.getDocsWithTweetsCount();
            this.model.getDocsWithSubtitleCount();
        },

        render: function(){
            if (DEBUG) console.log('AboutView:render');

            this.$el.html(_.template(aboutTemplate));

            return this;
        },

        renderAboutText: function(data){
            if (DEBUG) console.log('AboutView:renderAboutText');

            this.$el.find('h1').html(data.title);
            this.$el.find('#abouttext').html(data.maintext);
        },

        renderIndexStats: function(){
            if (DEBUG) console.log('AboutView:renderIndexStats');

            var stats_html = '';

            if('totalDocs' in this.stats){
                stats_html += '<li><span>' + this.numberFormat(this.stats.totalDocs) + '</span> <em>broadcasts</em> are currently indexed</li>';
            }

            if('docsWithTweetsCount' in this.stats){
                stats_html += '<li><span>' + this.stats.docsWithTweetsCount + '</span> broadcasts are associated with <em>Tweets</em>';
            }

            if('docsWithSubtitleCount' in this.stats){
                stats_html += '<li><span>' + this.stats.docsWithSubtitleCount + '</span> broadcasts have <em>subtitles</em>';
            }

            if('firstBroadcastDate' in this.stats){
                stats_html += '<li><span>' + this.dateFormat(this.stats.firstBroadcastDate) +'</span> is the date of the <em>first broadcast</em> in the index</li>';
            }

            if('lastBroadcastDate' in this.stats){
                stats_html += '<li><span>' + this.dateFormat(this.stats.lastBroadcastDate) +'</span> is the date of the <em>last broadcast</em> in the index</li>';
            }

            this.$el.find('#collectionstats ul').html(stats_html);
        }
    });

    return AboutView;
});

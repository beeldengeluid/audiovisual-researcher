define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'app',
    'text!../../../templates/search/timeslider.html'
],
function($, _, Backbone, d3, app, timeSliderTemplate){
    var TimeSliderView = Backbone.View.extend({
        initialize: function(options){
            // Control visibility on init. Element is shown on first query.
            this.is_visible = true;
            app.vent.once('QueryInput:input', this.toggleVisibility, this);

            this.date_facet_name = options.date_facet;
            this.model.on('change:facets', this.updateFacetValues, this);
            app.vent.on('model:redraw:' + this.model.get('name'), function(){
                var histogram = this.model.get('facets')[this.date_facet_name].entries;
                if(histogram.length < 1){
                    return;
                }
                var min = histogram[0].time;
                var max = histogram[histogram.length - 1].time;
                this.updateSliderLabels(min, max);
            }, this);

            this.convertTime = {
                year: d3.time.format('%Y'),
                month: d3.time.format('%b. %Y'),
                week: d3.time.format('%e %b. %Y'),
                day: d3.time.format('%e %b. %Y')
            };
        },

        render: function(){
            if (DEBUG) console.log('TimeSliderView:render');

            var self = this;

            this.$el.html(_.template(timeSliderTemplate));
            this.timeslider = this.$el.find('.slider').slider({
                range: true,
                step: 1,
                animate: 'slow',
                start: function(event, ui){
                    // set start value for logging purposes
                    self.startValue = ui.value;
                },
                slide: function(event, ui){
                    self.updateSliderLabels(ui.values[0], ui.values[1]);
                },
                stop: function(event, ui){
                    self.changeFacet(event, ui, self.facetName);
                    app.vent.trigger('Logging:clicks', {
                        action: 'daterange_facet',
                        fromDateMs: self.startValue,
                        toDateMs: ui.value,
                        modelName: self.model.get('name')
                    });
                }
            });

            return this;
        },

        updateSliderLabels: function(min, max){
            if (DEBUG) console.log('TimeSliderView:updateSliderLabels');
            var interval = this.model.get('interval');
            if(!interval) interval = this.model.get('defaultInterval');

            min = this.convertTime[interval](new Date(min));
            max = this.convertTime[interval](new Date(max));

            this.$el.find('.slider-lower-val').html(min);
            this.$el.find('.slider-upper-val').html(max);
        },

        updateFacetValues: function(){
            if (DEBUG) console.log('TimeSliderView:updateFacetValues');

            var histogram = this.model.get('facets')[this.date_facet_name].entries;

            if(histogram.length < 1){
                this.disabled = true;
                return;
            }
            else {
                if(this.disabled === true){
                    this.disabled = false;
                }
            }

            this.min = histogram[0].time;
            this.max = histogram[histogram.length - 1].time;

            this.timeslider.slider('option', 'min', this.min);
            this.timeslider.slider('option', 'max', this.max);
            this.timeslider.slider('option', 'values', [this.min, this.max]);
            this.updateSliderLabels(this.min, this.max);
        },

        changeFacet: function(event, ui, facet){
            var self = this;
            var min = new Date(ui.values[0]);
            var max = new Date(ui.values[1]);
            if (DEBUG) console.log('TimeSliderView:changeFacet', [min, max]);

            var interval = this.model.get('interval');
            if(!interval) interval = this.model.get('defaultInterval');
            // ES filters out documents with creation dates later than Jan. 1 in a year,
            // so add a <interval> to the max value
            max = d3.time[interval].offset(max, 1);

            // Perform the actual query
            this.model.modifyFacetFilter(this.date_facet_name, [min, max], true);

            // To prevent the date range slider from updating the min and max
            // values as soon as the user moves a handle, we temporary switch
            // off the facet value change listener.
            this.model.off('change:facets', this.updateFacetValues, this);

            // Update the facet values and set the slider to min/max positions directly after
            // the user submits a new keyword query
            app.vent.once('QueryInput:input:' + this.model.get('name'), function(){
                self.updateFacetValues();
            });
        },

        toggleVisibility: function(){
            if (DEBUG) console.log('TimeSeriesView:toggleVisibility');

            if(this.is_visible){
                this.$el.hide();
                this.is_visible = false;
            }
            else {
                this.$el.show();
                this.is_visible = true;
            }

            return this;
        }
    });

    return TimeSliderView;
});

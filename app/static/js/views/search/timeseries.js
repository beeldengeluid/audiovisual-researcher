define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'app'
],
function($, _, Backbone, d3, app){
    var TimeseriesView = Backbone.View.extend({
        initialize: function(){
            var self = this;

            this.chart = {
                margin: {
                    top: 20,
                    right: 60,
                    bottom: 40,
                    left: 70
                },
                max: {
                    date: {
                        query1: -Infinity,
                        query2: -Infinity
                    },
                    hits: {
                        query1: -Infinity,
                        query2: -Infinity
                    }
                },
                min: {
                    date: {
                        query1: Infinity,
                        query2: Infinity
                    }
                },
                chartInterval: null,
                intervals: {
                    q1: null,
                    q2: null
                },
                disabled: {
                    q1: true,
                    q2: true
                },
                fadedOut: false,
                ISOFormat: d3.time.format('%Y-%m-%d'),
                dateFormats: {
                    year: d3.time.format('%Y'),
                    month: d3.time.format('%b. %Y'),
                    week: d3.time.format('%e %b. %Y'),
                    day: d3.time.format('%e %b. %Y')
                },
                x: d3.time.scale(),
                y: d3.scale.linear(),
                yAxisLabelFormat: d3.format('d'), // Make sure that no decimals can appear on y axis
                xAxis: d3.svg.axis().orient('bottom'),
                yAxis: d3.svg.axis().orient('left'),
                line: d3.svg.line()
                        .x(function(d){
                            return self.chart.x(d.date);
                        })
                        .y(function(d){
                            return self.chart.y(d.count);
                        })
                        .interpolate('monotone')
            };

            // Control visibility on init. Element is shown on first query.
            this.is_visible = true;
            app.vent.once('QueryInput:input', this.toggleVisibility, this);

            _.each(this.options.models, function(model, name){
                model.on('change:facets', function(){
                    self.determineInterval(model);
                });

                app.vent.on('model:redraw:' + model.get('name'), function(){
                    if(model.get('facets').broadcast_start_date.entries.length < 1){
                        self.chart.disabled[model.get('name')] = true;
                    }
                    else {
                        self.chart.disabled[model.get('name')] = false;
                    }

                    if(self.chart.disabled.q1 && self.chart.disabled.q2){
                        self.$el.fadeOut();
                        self.chart.fadedOut = true;
                    } else {
                        if(self.chart.fadedOut){
                            self.$el.fadeIn();
                        }
                    }

                    self.renderChart();
                });
            });

            $(window).resize(_.debounce(function(){
                self.renderChart();
            }, 50));
        },

        render: function(){
            if (DEBUG) console.log('TimeSeriesView:render');
            this.chart.svg = d3.select(this.el).append('svg')
                .attr('width', 0)
                .attr('height', 0);

            this.chart.innerContainer = this.chart.svg
                                            .append('g')
                                            .attr('class', 'inner');

            this.chart.xAxis.scale(this.chart.x);
            this.chart.yAxis.scale(this.chart.y);

            this.chart.innerContainer.append('g')
                .attr('class', 'x axis')
                .call(this.chart.xAxis);

            this.chart.innerContainer.append('g')
                .attr('class', 'y axis')
                .call(this.chart.yAxis);

            this.chart.xLabel = this.chart.innerContainer.select('g.x.axis')
                .append('text');

            this.chart.yLabel = this.chart.innerContainer.select('g.y.axis')
                .append('text')
                .attr('transform', 'rotate(-90)');

            this.chart.svg.append('g')
                .attr('class', 'legend')
                .attr('height', this.chart.margin.top);

            return this;
        },

        renderChart: function(){
            if (DEBUG) console.log('TimeSeriesView:renderChart');

            var self = this;
            var width = this.width = $(this.options.widthElement).width() - this.chart.margin.left - this.chart.margin.right;
            var height = this.options.height - this.chart.margin.top - this.chart.margin.bottom;

            this.chart.svg.transition()
                .attr('width', width + this.chart.margin.left + this.chart.margin.right)
                .attr('height', height + this.chart.margin.top + this.chart.margin.bottom);
            this.chart.innerContainer.attr('transform', 'translate(' + this.chart.margin.left + ',' + this.chart.margin.top + ')');

            this.chart.x.range([0, width]);
            this.chart.y.range([height, 0]);

            this.chart.innerContainer.select('g.x.axis')
                .attr('transform', 'translate(0,' + height + ')');

            this.chart.yAxis
                .tickSize(-width, 6, 0)
                .tickFormat(this.chart.yAxisLabelFormat)
                .tickPadding(8);

            this.chart.xAxis
                .tickSize(-height, 6, 0)
                .tickPadding(8);

            // Create an array with objects holding the data for a line,
            // padded with zeroes for missing dates
            var data = _.map(this.options.models, function(model, modelName){
                if (model.get('facets')){
                    self.chart.chartInterval = model.get('interval');
                    var datum = _.map(model.get('facets').broadcast_start_date.entries, function(d){
                        return {date: self.chart.ISOFormat(new Date(d.time)), count: d.count};
                    });

                    var minMaxDates = d3.extent(model.get('facets').broadcast_start_date.entries, function(d){ return d.time; });
                    var maxHits = d3.max(datum, function(d){ return d.count; });

                    self.chart.max.date[modelName] = minMaxDates[1];
                    self.chart.min.date[modelName] = minMaxDates[0];
                    self.chart.max.hits[modelName] = maxHits;

                    var range = d3.time[self.chart.chartInterval]
                        .range(
                            d3.time[self.chart.chartInterval].offset(new Date(minMaxDates[0]), -1),
                            d3.time[self.chart.chartInterval].offset(new Date(minMaxDates[1]), 0)
                        );

                    // Insert a date with 0 hits for every date in the
                    // range that doesn't have a value
                    var paddedData = _.map(range, function(d){
                        var datapoint = _.where(datum, {date: self.chart.ISOFormat(d)});
                        if(datapoint.length > 0){
                            return {date: d, count: datapoint[0].count};
                        } else {
                            return {date: d, count: 0};
                        }
                    });

                    return {name: modelName, data: paddedData};
                }
            });

            this.chart.x.domain([
                d3.min([
                    this.chart.min.date.query1,
                    this.chart.min.date.query2
                ]),
                d3.max([
                    this.chart.max.date.query1,
                    this.chart.max.date.query2
                ])
            ]);

            this.chart.y.domain([0, d3.max([this.chart.max.hits.query1, this.chart.max.hits.query2])]);

            _.each(data, function(d){
                // First, check if data exists
                if(d){
                    var timeSeriesContainer = self.chart.innerContainer.selectAll('g.' + d.name)
                                                .data([d.data]);

                    timeSeriesContainer.enter()
                        .append('g')
                        .attr('class', d.name + ' line');

                    // Bind data to path element
                    var timeSeries = timeSeriesContainer.selectAll('path')
                                        .data([d.data]);

                    // Bind data to circle elements
                    var circles = timeSeriesContainer.selectAll('circle')
                                    .data(d.data);

                    timeSeries.enter().append('path')
                        .style('stroke', self.options.models[d.name].attributes.color);

                    timeSeries.transition()
                        .duration(500)
                        .attr('d', function(dp){
                            return self.chart.line(dp);
                        });

                    circles.enter()
                        .append('circle')
                        .style('fill', self.options.models[d.name].attributes.color)
                        .attr('opacity', 1)
                        .attr('r', '2.5px')
                        .attr('cx', function(dp){
                            return self.chart.x(dp.date);
                        })
                        .attr('cy', function(dp){
                            return self.chart.y(dp.count);
                        })
                        .on('mouseover', function(dp){
                            d3.select(this).transition()
                                .attr('r', '4px');
                        })
                        .on('mouseout', function(){
                            d3.select(this).transition()
                                .attr('r', '2.5px');
                        });

                    // Circle coordinates are updated in the enter and in
                    // the update selection, to prevent them from swooshing
                    // over the screen
                    circles.transition()
                        .duration(500)
                        .attr('data-original-title', function(e){
                            // Bind tooltip to this circle element
                            self.$el.find(this).tooltip({ container: 'div#timeseries' });

                            // Set the title as an attribute of the original circle,
                            // otherwise it will use the jQuery object reference when
                            // updated, yielding strange dates
                            var title = self.chart.dateFormats[self.chart.chartInterval](e.date) + ': ' + e.count;
                            if(e.count === 1){
                                return title + ' hit';
                            } else {
                                return title + ' hits';
                            }
                        })
                        .attr('cx', function(dp){
                            return self.chart.x(dp.date);
                        })
                        .attr('cy', function(dp){
                            return self.chart.y(dp.count);
                        });

                    circles.exit()
                        .transition()
                        .attr('opacity', function(){
                            self.$el.find(this).tooltip('destroy');
                            return 0;
                        })
                        .transition()
                        .remove();

                    var legendContainer = d3.select('g.legend').selectAll('g')
                        .data([d], function(e){
                            return e.name;
                        });

                    var g = legendContainer.enter()
                        .append('g')
                        .attr('class', d.name + ' legendcontainer')
                        .on('mouseover', function(e){
                            d3.select('g.line.' + e.name + ' path')
                                .transition()
                                .style('stroke-width', '3px');
                            d3.selectAll('g.line.' + e.name + ' circle')
                                .transition()
                                .attr('r', '4px');
                        })
                        .on('mouseout', function(e){
                            d3.select('g.line.' + e.name + ' path')
                                .transition()
                                .style('stroke-width', '1.5px');
                            d3.selectAll('g.line.' + e.name + ' circle')
                                .transition()
                                .attr('r', '2px');
                        });

                    g.append('circle')
                        .attr('cx', function(e){ return e.name == 'query1' ? ((width + self.chart.margin.right + self.chart.margin.left) / 2) - 15 : ((width + self.chart.margin.right + self.chart.margin.left) / 2) + 15; })
                        .attr('cy', 10)
                        .attr('width', 10)
                        .attr('height', 10)
                        .style('fill', function(e){ return self.options.models[e.name].attributes.color; });

                    g.append('text')
                        .attr('x', function(e){ return e.name == 'query1' ? ((width + self.chart.margin.right + self.chart.margin.left) / 2) - 25 : ((width + self.chart.margin.right + self.chart.margin.left) / 2) + 25; })
                        .attr('y', 15)
                        .attr('text-anchor', function(d){ return d.name == 'query1' ? 'end' : 'start'; }) // determine if text should be anchored left or right from the circle
                        .attr('height', 30);

                    legendContainer.transition()
                        .each(function(f){
                            d3.select(this).select('text')
                                .text(function(e){ return self.options.models[f.name].attributes.queryString.length > 20 ? self.options.models[f.name].attributes.queryString.slice(0, 16) + '...' : self.options.models[f.name].attributes.queryString; });

                            // Move the circle if the chart size is updated
                            d3.select(this).select('circle')
                                .transition()
                                .attr('r', 5)
                                .attr('cx', function(e){ return e.name == 'query1' ? ((width + self.chart.margin.right + self.chart.margin.left) / 2) - 15 : ((width + self.chart.margin.right + self.chart.margin.left) / 2) + 15; });

                            // Move the label if the chart size is updated
                            d3.select(this).select('text')
                                .transition()
                                .attr('x', function(e){ return e.name == 'query1' ? ((width + self.chart.margin.right + self.chart.margin.left) / 2) - 25 : ((width + self.chart.margin.right + self.chart.margin.left) / 2) + 25; });
                        });
                }
            });

            // (Re-)set the chart labels
            this.chart.xLabel
                .transition()
                .attr('x', width / 2)
                .attr('y', self.chart.margin.bottom - 5)
                .attr('text-anchor', 'middle')
                .attr('opacity', 0.6)
                .text('Time in ' + self.chart.chartInterval + 's');

            this.chart.yLabel
                .transition()
                .attr('x', -(height / 2))
                .attr('y', -(this.chart.margin.left / 2))
                .attr('dy', -10)
                .attr('opacity', 0.6)
                .text('Hits');

            this.chart.xAxis
            .tickFormat(this.chart.dateFormats[this.chart.chartInterval]);

            var t = this.chart.innerContainer.transition();

            t.select('g.x.axis').call(this.chart.xAxis);
            t.select('g.y.axis').call(this.chart.yAxis);
        },

        determineInterval: function(model, options){
            var self = this;
            if (DEBUG) console.log('TimeSeriesView:determineInterval');
            var interval = model.get('interval');
            var usingDefaultInterval = false;
            var downsize = false;
            if(!model.get('interval')){
                interval = model.get('defaultInterval');
                usingDefaultInterval = true;
            }
            if(options){
                if (options.interval) {
                    interval = options.interval;
                }
                if(options.downsize){
                    downsize = options.downsize;
                }
            }

            model.getDateHistogram({}, function(data){
                var extent = d3.extent(data.facets.broadcast_start_date.entries, function(d){ return d.time; });

                var datapoints = d3.time[interval].range(
                    d3.time[interval].offset(new Date(extent[0]), -1),
                    d3.time[interval].offset(new Date(extent[1]), 0)
                );

                if ((extent[0] === extent[1] || datapoints.length < 10) && interval !== 'day') {
                    /*
                       If the start and en date are the same or if there are not enough
                       data points, and we haven't reached day granularity yet, perform
                       a more detailed query.
                    */
                    interval = ALLOWED_INTERVALS[ALLOWED_INTERVALS.indexOf(interval) + 1];
                    self.determineInterval(model, {
                        interval: interval
                    });
                }
                else if(datapoints.length > 100 || downsize){
                    /*
                       If we have to many datapoints, or are downsizing in
                       granularity.

                    */
                    // QUICK FIX (otherwise interval becomes null and results in error)
                    if (!usingDefaultInterval) {
                        interval = ALLOWED_INTERVALS[ALLOWED_INTERVALS.indexOf(interval) - 1];
                    }
                    if (DEBUG) console.log('TimeSeriesView:determinedInterval: ' + interval);

                    if(interval == 'year'){
                        model.set('interval', interval, {silent: true});
                        self.chart.intervals[model.get('name')] = interval;
                        self.setIntervals();
                    }
                    else {
                        self.determineInterval(model, {
                            interval: interval,
                            downsize: true
                        });
                    }
                }
                else {
                    /*
                       We have either found enough datapoints, or have reached
                       the most detailed granularity, so set the interval on this
                       model instance, and trigger the event that will cause the
                       timeseries to render.
                    */
                    if (DEBUG) console.log('TimeSeriesView:' + model.get('name') + ':determinedInterval: ' + interval);
                    model.set('interval', interval, {silent: true});
                    self.chart.intervals[model.get('name')] = interval;
                    self.setIntervals();
                }
            });
        },

        setIntervals: function(model){
            var intervals = [];

            _.each(this.chart.intervals, function(interval){
                if(interval){
                    intervals.push(interval);
                }
            });

            var interval = _.first(_.sortBy(intervals, function(interval){
                return ALLOWED_INTERVALS.indexOf(interval);
            }));

            _.each(this.options.models, function(model, name){
                // This is an ugly solution. Please fix me.
                if(model.get('hits') instanceof Array){
                    // Only update the interval when there are hits
                    model.set('interval', interval, {silent: true});
                    // Use vent as the interval doesn't have to be changed
                    app.vent.trigger('interval:set');
                }
            });
        },

        /*
        Custom make method, as Backbone does not support creation of
        namespaced (i.e. SVG) elements.
        */
        make: function(tagName, attributes, content){
            var el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
            if(attributes) $(el).attr(attributes);
            if(content) $(el).html(content);
            return el;
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

    return TimeseriesView;
});

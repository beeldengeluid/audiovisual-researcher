define([
    'jquery',
    'underscore',
    'backbone',
    'd3',
    'app',
    'text!../../../templates/search/barchart.html'
],
function($, _, Backbone, d3, app, barchartTemplate){
    var FacetView = Backbone.View.extend({
        initialize: function(options){
            if (DEBUG) console.log('BarChartView:' + options.name + ':initialize');
            this.modelName = options.name;

            var orient = (this.modelName === 'q1') ? 'right' : 'left';
            this.chart = {
                x: d3.scale.linear(),
                y: d3.scale.ordinal(),
                xAxis: d3.svg.axis(),
                yAxis: d3.svg.axis().orient(orient),
                margin: {
                    top: 20,
                    right: 50,
                    bottom: 20,
                    left: 110
                },
                barHeight: BARCHART_BAR_HEIGHT,
                nrOfBars: BARCHART_BARS
            };
        },

        render: function(tab){
            if (DEBUG) console.log('BarChartView:' + this.modelName + ':render');
            var self = this;
            var facets = this.model.get('facets');
            var heights = [];

            if(facets){
                var data = _.first(facets[tab].terms, this.chart.nrOfBars);

                var svg = d3.select(this.el)
                    .append('svg')
                    .attr('class', this.modelName + ' barchart');

                var height = this.chart.barHeight * data.length;
                heights.push(height); // Use to determine optimal height

                var width = this.$el.find('svg').width() - this.chart.margin.right - this.chart.margin.left;

                // Add dimensions here, as we need to find the initial width that is inherited from the div above
                svg.attr('height', height + this.chart.margin.top + this.chart.margin.bottom)
                   .attr('width', width + this.chart.margin.right + this.chart.margin.left);

                var innerContainer = svg.append('g');

                // Make sure the barcharts are aligned correctly
                if(this.modelName === 'q1'){
                    var w = this.$el.find('svg').width() - width - this.chart.margin.left;
                    innerContainer.attr('transform', 'translate(' + w + ',' + this.chart.margin.top + ')');
                } else {
                    innerContainer.attr('transform', 'translate(' + this.chart.margin.left + ',' + this.chart.margin.top + ')');
                }

                this.chart.x
                    .range([0, width])
                    .domain([0, d3.max(data, function(d){ return d.count; })]);

                this.chart.y
                    .rangeRoundBands([0, height], 0.1)
                    .domain(data.map(function(d){ return d.term; }));

                this.chart.yAxis
                    .scale(this.chart.y)
                    .tickFormat(function(d){
                        // Append an invisible rect to display a title:
                        // the SVG specification does not allow title in
                        // attributes, but requires a nested <title> to a
                        // visual element, such as <rect> or <circle>.
                        d3.select(this.parentNode)
                            .append('g')
                            .append('rect')
                              // Return proper x value depending on the model
                              .attr('x', function(){ return self.modelName === 'q1' ? 0 : -self.chart.margin.left; })
                              .attr('y', self.chart.y.rangeBand() / -2)
                              .attr('width', self.chart.margin.left)
                              .attr('height', self.chart.y.rangeBand())
                              .attr('opacity', 0)
                            .append('title')
                            .text(d);

                        // Append dots for labels that are too long
                        return d.length < 16 ? d : d.slice(0, 13) + '...';
                    });

                var yAxisContainer = innerContainer.append('g')
                    .attr('class', 'y axis')
                    // .transition()
                    .call(this.chart.yAxis);

                if(this.modelName === 'q1'){
                    // Place labels on right side of q1
                    yAxisContainer.attr('transform', 'translate(' + width + ',0)');
                }

                var rects = innerContainer.selectAll('rect.bar').data(data);

                rects.enter().append('g') // Append g element so we can add a text label later
                    .append('rect')
                    .attr('y', function(d){
                        return self.chart.y(d.term);
                    })
                    .attr('opacity', 0)
                    .attr('x', function(d){
                        // Invert the bars for chart q1
                        return self.modelName === 'q1' ? (width - self.chart.x(d.count)) : 0;
                    })
                    .attr('width', function(d){
                        return self.chart.x(d.count);
                    })
                    // use rangeBand to maintain bar separation
                    .attr('height', self.chart.y.rangeBand())
                    .attr('class', self.modelName + ' bar ' + tab)
                    .append('title')
                    .text(function(d){ return d.term; });

                rects.transition()
                    // We actually have a g element, because we need a container for text:
                    // SVG doesn't display <text> inside <rect>
                    .delay(function(d, i){
                        return i / data.length * 500;
                    })
                    .select('rect')
                    .transition()
                    .attr('opacity', 1);

                var xWidth = 0;
                var dx = 3;
                var textAnchor = 'start';

                if(this.modelName === 'q1'){
                    // Settings that are different for q1
                    xWidth = width;
                    dx = -3;
                    textAnchor = 'end';
                }

                // Render counts as labels in the barchart
                rects.each(function(d){
                    d3.select(this).append('text')
                        .attr('x', xWidth)
                        .attr('dx', dx)
                        .attr('y', self.chart.y(d.term) + self.chart.y.rangeBand() / 2)
                        .attr('dy', '.35em')
                        .attr('text-anchor', textAnchor)
                        .attr('fill', 'white')
                        .attr('font-size', 10)
                        .text(d.count);
                });
            }

            return this;
        }
    });

    return FacetView;
});

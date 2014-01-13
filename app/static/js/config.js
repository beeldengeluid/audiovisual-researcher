define({
	DEBUG: true,
	SENTRY_LOGGING: true,
	HITS_PER_PAGE: 5,
	ALLOWED_INTERVALS: ['year', 'month', 'week', 'day'],
	AVAILABLE_FACETS: {
		'broadcast_start_date': {
			name: 'Start Date',
			description: '',
			ui_presentation: 'range',
			date_histogram: {
				field: 'start',
				interval: 'year' // allowed values are ['year', 'month', 'week', 'day']
			},
			nested: 'broadcastDates'
		},
		'channels': {
			name: 'Channels',
			description: '',
			ui_presentation: 'checkbox',
			terms: {
				field: 'broadcasters',
				size: 30
			}
		},
		'producers': {
			name: 'Producers',
			description: '',
			ui_presentation: 'checkbox',
			terms: {
				field: 'roleValue',
				size: 30
			},
			facet_filter : {
				term: {
					roleKey : 'producent'
				}
            },
            nested: 'roles'
		},
		'people': {
			name: 'People',
			description: '',
			ui_presentation: 'checkbox',
			nested_filter_field: 'categoryValue',
			terms: {
				field: 'untouched',
				size: 30
			},
			facet_filter: {
				term: {
					categoryKey: 'person'
				}
			},
			nested: 'categories'
			/*terms: {
				field: 'roleValue',
				size: 30
			},
			facet_filter : {
				or: [
					{term: {roleKey: 'maker'}},
					{term: {roleKey: 'executive'}},
					{term: {roleKey: 'speaker'}}
				]
            },
            nested: 'roles'*/
		},
		'genres': {
			name: 'Genres',
			description: '',
			ui_presentation: 'checkbox',
			nested_filter_field: 'categoryValue',
			terms: {
				field: 'untouched',
				size: 30
			},
			facet_filter : {
				term: {
					categoryKey : 'genre'
				}
            },
            nested: 'categories'
		},
		'keywords': {
			name: 'Keywords',
			description: '',
			ui_presentation: 'checkbox',
			nested_filter_field: 'categoryValue',
			terms: {
				field: 'untouched',
				size: 30
			},
			facet_filter : {
				term: {
					categoryKey : 'keyword'
				}
            },
            nested: 'categories'
		},
		// This facet operates on the complete set of Twitter terms, but can be
		// very memory expensive (every term present in the text has to be kept
		// in memory)
		'tweets': {
			name: 'Tweets',
			description: '',
			ui_presentation: 'checkbox',
			terms: {
				field: 'tweetText',
				size: 30
			},
			nested: 'tweets'
		},
		// This facet operates on a list of the top 100 terms extracted from Tweets
		// (generated in whatever way; that is up to the indexer), as to economize
		// on memory usage
		'top_100_twitter_terms': {
			name: 'Tweets',
			description: '',
			ui_presentation: 'checkbox',
			terms: {
				field: 'top_100_twitter_terms',
				size: 30
			}
		},
		// This facet operates on a list of the top 100 terms extracted from subtitles
		// (generated in whatever way; that is up to the indexer), as to economize
		// on memory usage
		'top_100_subtitle_terms': {
			name: 'Subtitles',
			description: '',
			ui_presentation: 'checkbox',
			terms: {
				field: 'top_100_subtitle_terms',
				size: 30
			}
		}
	},

	// List of facets that are displayed (in the different tabs) by default
	DEFAULT_FACETS: ['genres', 'channels', 'producers', 'keywords',
                     'people', 'tweets', 'subtitles'],

	// The facet that is used for the date range slider
	DEFAULT_DATE_FACET: 'broadcast_start_date',

	// Defenition of sources/fields that can be used for free text searching
	AVAILABLE_SEARCH_FIELDS: [
		{
			id: 'immix',
			name: 'iMMix metadata',
			icon: 'icon-film',
			fields: ['titles', 'mainTitle', 'summaries', 'descriptions']
		},
		{
			id: 'subtitles',
			name: 'T888 subtitles',
			icon: 'icon-comment',
			fields: ['subtitles']
		},
		{
			id: 'twitter',
			name: 'Tweets',
			icon: 'icon-twitter',
			fields: ['tweetText'],
			nested: 'tweets'
		}
	],

	// The fields that should be returned for each hit when searching
	SEARCH_HIT_FIELDS: ['mainTitle', 'broadcastDates', 'summaries'],

	MINIMUM_CLOUD_FONTSIZE: 10,
	MAXIMUM_CLOUD_FONTSIZE: 30,

	BARCHART_BARS: 10,
	BARCHART_BAR_HEIGHT: 20,

	// The fields that should be considered when creating highlighted snippets for
	// a search result.
	HIT_HIGHLIGHT_FIELDS: ['descriptions', 'summaries', 'subtitles', 'tweetText'],
	// The max. length of a highlighted snippet (in chars)
	HIT_HIGHLIGHT_FRAGMENT_SIZE: 200,
	// The max. number of highlighted snippets (per field) to return
	HIT_HIGHLIGHT_FRAGMENTS: 1,

	// Enables or disables application usage logging
	ENABLE_USAGE_LOGGING: true,
	// Determine which events will be logged, possible values are:
	//
	LOG_EVENTS: ['clicks', 'results'],
	/* clicks actions:
         submit_query: User submits a new query. Log querystring and modelName.
         change_search_field: User adds or removes one of the collections from the search. Log modelName, the collection, and whether it has been activated or not
         daterange_facet: User uses timeslider. Log from date in ms, to date in ms, and the model name
         change_facet_tab: User switches tabs in facetsview. Log source and target tab
         view_document: User clicks on a single document in result list. Log document id and model name
         page_switch: User switches between home, about and querysyntax page. Log source and target page.
       results actions:
         results: A result list is rendered. Log the visible doc_ids and model name.
	*/


	// The URL to the JSON file that contains the (textual) information
	// displayed on the 'about' page
	ABOUT_PAGE_CONTENT_URL: '/about.json',
	// URL to JSON file that contains text for 'help' page
	HELP_PAGE_CONTENT_URL: '/help.json'
});

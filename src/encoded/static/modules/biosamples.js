define(['exports', 'jquery', 'underscore', 'base', 'table_sorter', 'table_filter',
    'text!templates/sort_filter_table.html',
    'text!templates/biosamples/item.html',
    'text!templates/biosamples/row.html',
    'text!templates/biosamples/document.html'
    ],
function biosamples(exports, $, _, base, table_sorter, table_filter, home_template, item_template, row_template, document_template) {

    // cannoot get factory to give correct object!
    exports.biosample_factory = function biosample_factory(attrs, options) {
        var new_obj = new base.Model(attrs, options);
        new_obj.url = '/biosamples/' + options.route_args[0];
        return new_obj;
    };

    exports.Biosample = base.Model.extend({
        urlRoot: '/biosamples/',
        initialize: function initialize(attrs, options) {
            if (options && options.route_args) {
                this.id = options.route_args[0];
                this.deferred = this.fetch();
            }
        }
    });

    var BiosampleCollection = exports.BiosampleCollection = base.Collection.extend({
        model: base.Model, // base.Model???
        url: '/biosamples/'
    });

    // The biosamples home screen
    var biosampleHomeView = exports.BiosamplesHomeView = base.TableView.extend({
        template: _.template(home_template),
        row_template: _.template(row_template),
        table_header: [ 'Accession',
                        'Term',
                        'Type',
                        'Species',
                        'Source',
                        'Submitter',
                        'Treatments',
                        'Constructs'
                        ],
        sort_initial: 2  // oh the index hack it burns
    },
    {
        route_name: 'biosamples',
        model_factory: exports.BiosampleCollection
    });

    exports.DocumentView = base.View.extend({
        tagName: 'section',
        attributes: {'class': 'type-document view-detail panel'},
        initialize: function initialize(options) {
            var model = options.model;
            this.deferred = model.deferred;
        },
        template: _.template(document_template)
    });

    var BiosampleView = exports.BiosampleView = base.View.extend({
        document: exports.DocumentView,
        initialize: function initialize(options) {
            var model = options.model,
                deferred = $.Deferred();
            this.deferred = deferred;
            model.deferred = model.fetch();
            $.when(model.deferred).done(_.bind(function () {
                this.documents = _.map(model.links.documents, _.bind(function (item) {
                    item.deferred = item.fetch();
                    var subview = new this.document({model: item});
                    $.when(subview.deferred).then(function () {
                        subview.render();
                    });
                    return subview;
                }, this));
                $.when.apply($, _.pluck(this.documents, 'deferred')).then(function () {
                    deferred.resolve();
                });
            }, this));
        },
        template: _.template(item_template),
        render: function render() {
            BiosampleView.__super__.render.apply(this, arguments);
            var div = this.$el.find('div.protocols');
            if(this.documents.length) div.before('<h3>Protocols and supporting documents</h3>');
            _.each(this.documents, function (view) {
                div.append(view.el);
            });
            return this;
        }
    }, {
        route_name: 'biosample',
        model_factory: exports.biosample_factory
    });

    var biosampleAddOverlay = exports.biosampleAddOverlay = base.Modal.extend({
        tagName: 'form',
        events: {'submit': 'submit'},
        className: base.Modal.prototype.className + ' form-horizontal',
        initialize: function initialize(options) {
            var name = options.route_args[0];
            this.action = _.find(this.model._links.actions, function(item) {
                return item.name === name;
            });
            this.title = this.action.title;
            this.deferred = $.get(this.action.profile);
            this.deferred.done(_.bind(function (data) {
                this.schema = data;
            }, this));
        },
        render: function render() {
            biosampleAddOverlay.__super__.render.apply(this, arguments);
            this.form = this.$('.modal-body').jsonForm({
                schema: this.schema,
                form: _.without(_.keys(this.schema.properties), 'term_id', 'passage_number',
                    'culture_harvest_date', 'culture_start_date', 'date_obtained', 'starting_amount',
                    'construct_list', 'treatment_list', 'protocol_document_list', 'dbxref',
                    'related_biosample_list'),
                submitEvent: false,
                onSubmitValid: _.bind(this.send, this)
            });

            setTimeout(function() {
                $(document).ready(function(){
                    $("#" + document.getElementsByName("term_name")[0].id)
                        .ajaxChosen({
                            type: "GET",
                            url: "/search",
                            jsonTermKey: "query",
                            data: {index: 'ontology'},
                            dataType: "json",
                            minLength: 2,
                            queryLimit: 100,
                            delay: 100,
                            chosenOptions: {'allow_single_deselect':'true'},
                            searchingText: "Searching...",
                            noresultsText: "No results.",
                            initialQuery: false
                        }, function (data) {
                            return _.map(data, function (value, key) {
                                return {value: key + ',' + value , text: value + ' (' + key + ')'};
                            });
                    });
                    // Populating labs using user details 
                    var id = document.getElementsByName("lab")[0].id;
                    $("#" + id).chosen();
                    var awardId = document.getElementsByName("award")[0].id;
                    $("#"+ awardId).chosen();
                    $.ajax({
                        async: false,
                        url: "/current-user",
                        dataType: "json",
                        success:  function(user) {
                           var resources = user['_embedded']['resources'];
                           _.each(resources, function(resource) {
                                var key = (resource['_links']['self']['href']).substr((resource['_links']['self']['href']).length - 36);
                                if(resource['_links']['collection']['href'] == "/awards/") {
                                    $("#"+ awardId).append('<option value = ' + key + '>' + resource['number'] + '</option>');
                                }else {
                                    $("#"+ id).append('<option value = ' + key + '>' + resource['name'] + '</option>');
                                }
                           });
                        }
                    });
                    $("#"+ id).trigger('liszt:updated');
                    $("#"+ awardId).trigger('liszt:updated');
                    $("#" + document.getElementsByName("type")[0].id).chosen();
                    $("#" + document.getElementsByName("donor")[0].id)
                        .ajaxChosen({
                                type: "GET",
                                url: "/search",
                                jsonTermKey: "query",
                                data: {index: 'donor'},
                                dataType: "json"
                            }, function (data) {
                                return _.map(data, function (value, key) {
                                    return {value: key, text: value};
                                });
                        });
                    $("#" + document.getElementsByName("source")[0].id)
                        .ajaxChosen({
                                type: "GET",
                                url: "/search",
                                jsonTermKey: "query",
                                data: {index: 'source'},
                                dataType: "json"
                            }, function (data) {
                                return _.map(data, function (value, key) {
                                    return {value: key, text: value};
                                });
                        });
                });
            }, 1);
            return this;
        },
        submit: function submit(evt) {
            this.form.submit(evt);
        },
        send: function send(value)  {
            this.value = value;
            var terms = value['term_name'].split(',');
            this.value.term_name = terms[1];
            this.value.term_id = terms[0];
            this.model.sync(null, this.model, {
                url: this.action.href,
                type: this.action.method,
                contentType: 'application/json',
                data: JSON.stringify(value),
                dataType: 'json'
            }).done(_.bind(function (data) {
                console.log(data);
                var url = data._links.items[0].href;
                app.view_registry.history.path = null;
                app.view_registry.history.navigate(url, {trigger: true});
            }, this)).fail(_.bind(function (data) {
                console.log(data);
            }, this));
            return false;
        }
    }, {
        route_name: 'add',
        model_factory: function model_factory(attrs, options) {
            return app.view_registry.current_views.content.model;
        }
    });
    return exports;
});
